package com.piyumi.finsight_backend.service;

import com.piyumi.finsight_backend.dto.CategoryResponse;
import com.piyumi.finsight_backend.entity.Transaction;
import com.piyumi.finsight_backend.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.YearMonth;
import java.util.List;
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
}