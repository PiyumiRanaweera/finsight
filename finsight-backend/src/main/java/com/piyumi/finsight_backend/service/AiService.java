package com.piyumi.finsight_backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.piyumi.finsight_backend.dto.CategoryResponse;
import com.piyumi.finsight_backend.entity.Transaction;
import com.piyumi.finsight_backend.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AiService {

    private final GeminiService geminiService;
    private final CategoryService categoryService;
    private final TransactionRepository transactionRepository;

    public String suggestCategory(String email, String description) {
        List<String> categoryNames = categoryService.getAll(email).stream()
                .map(CategoryResponse::name)
                .toList();

        if (categoryNames.isEmpty()) return null;

        String prompt = """
                You are a personal finance assistant. Given a transaction description,
                pick the single best matching category from this list: %s

                Transaction description: "%s"

                Reply with ONLY the category name, exactly as written in the list.
                If nothing fits well, reply with exactly: NONE
                """.formatted(String.join(", ", categoryNames), description);

        String suggestion = geminiService.generate(prompt);
        return categoryNames.contains(suggestion) ? suggestion : null;
    }

    public String monthlyInsights(String email, int year, int month) {
        YearMonth ym = YearMonth.of(year, month);
        List<Transaction> txs = transactionRepository
                .findByUserEmailAndTransactionDateBetweenOrderByTransactionDateDesc(
                        email, ym.atDay(1), ym.atEndOfMonth());

        if (txs.isEmpty()) return "No transactions this month to analyze.";

        String txSummary = txs.stream()
                .map(t -> "%s | %s | LKR %s | %s".formatted(
                        t.getTransactionDate(),
                        t.getType(),
                        t.getAmount(),
                        t.getDescription()
                                + (t.getCategory() != null ? " [" + t.getCategory().getName() + "]" : "")))
                .collect(Collectors.joining("\n"));

        String prompt = """
                You are a friendly personal finance advisor in Sri Lanka (currency LKR).
                Analyze this month's transactions and give the user 3-4 short, helpful
                insights about their spending patterns. Be specific with numbers.
                Keep the whole response under 150 words. Use a warm, encouraging tone.
                Do not use markdown formatting, just plain text with line breaks.

                Transactions for %s %d:
                %s
                """.formatted(ym.getMonth(), year, txSummary);

        return geminiService.generate(prompt);
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> scanReceipt(String email, String base64Image, String mimeType) {
        List<String> categoryNames = categoryService.getAll(email).stream()
                .map(CategoryResponse::name)
                .toList();

        String prompt = """
                You are a receipt-reading assistant. Extract information from this receipt image.

                Reply with ONLY a JSON object, no markdown, no backticks, in exactly this format:
                {"amount": <total amount as number>, "date": "<date in YYYY-MM-DD format>", "merchant": "<store/merchant name>", "category": "<best match from this list or null: %s>"}

                Rules:
                - amount = the final TOTAL paid (after taxes/discounts)
                - If the date is unreadable, use null
                - If no category fits well, use null
                - Reply with the JSON object and absolutely nothing else
                """.formatted(String.join(", ", categoryNames));

        String raw = geminiService.generateWithImage(prompt, base64Image, mimeType);

        // Defensive cleanup: strip markdown fences if the model disobeys
        String cleaned = raw.replaceAll("```json", "").replaceAll("```", "").trim();

        try {
            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> parsed = mapper.readValue(cleaned, Map.class);

            // Validate the category against the user's real list
            Object category = parsed.get("category");
            if (category != null && !categoryNames.contains(category.toString())) {
                parsed.put("category", null);
            }
            return parsed;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "Could not read the receipt. Try a clearer photo.");
        }
    }

    public String chat(String email, String question, List<Map<String, String>> history) {
        // Build the user's financial context (last 3 months)
        YearMonth now = YearMonth.now();
        List<Transaction> txs = transactionRepository
                .findByUserEmailAndTransactionDateBetweenOrderByTransactionDateDesc(
                        email, now.minusMonths(2).atDay(1), now.atEndOfMonth());

        String txContext = txs.isEmpty()
                ? "No transactions in the last 3 months."
                : txs.stream()
                    .map(t -> "%s | %s | LKR %s | %s%s".formatted(
                            t.getTransactionDate(), t.getType(), t.getAmount(),
                            t.getDescription(),
                            t.getCategory() != null ? " [" + t.getCategory().getName() + "]" : ""))
                    .collect(Collectors.joining("\n"));

        String historyContext = history == null || history.isEmpty() ? "" :
                history.stream()
                        .map(m -> m.get("role") + ": " + m.get("content"))
                        .collect(Collectors.joining("\n"));

        String prompt = """
                You are FinSight's financial assistant for a user in Sri Lanka (currency LKR).
                Answer the user's question using ONLY the transaction data below.
                Be specific with numbers. Be concise (under 120 words). Warm, helpful tone.
                Plain text only, no markdown.
                If the question cannot be answered from the data, say so honestly.
                If the question is unrelated to personal finance, politely decline and
                say you can only help with their finances.

                User's transactions (last 3 months):
                %s

                Conversation so far:
                %s

                User's question: %s
                """.formatted(txContext, historyContext, question);

        return geminiService.generate(prompt);
    }
}