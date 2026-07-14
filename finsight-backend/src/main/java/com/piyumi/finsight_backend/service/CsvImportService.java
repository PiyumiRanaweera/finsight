package com.piyumi.finsight_backend.service;

import com.opencsv.CSVReader;
import com.piyumi.finsight_backend.dto.CategoryResponse;
import com.piyumi.finsight_backend.entity.Category;
import com.piyumi.finsight_backend.entity.Transaction;
import com.piyumi.finsight_backend.entity.User;
import com.piyumi.finsight_backend.repository.CategoryRepository;
import com.piyumi.finsight_backend.repository.TransactionRepository;
import com.piyumi.finsight_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.StringReader;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CsvImportService {

    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final GeminiService geminiService;
    private final CategoryService categoryService;

    private static final List<DateTimeFormatter> DATE_FORMATS = List.of(
            DateTimeFormatter.ofPattern("yyyy-MM-dd"),
            DateTimeFormatter.ofPattern("dd/MM/yyyy"),
            DateTimeFormatter.ofPattern("MM/dd/yyyy"),
            DateTimeFormatter.ofPattern("dd-MM-yyyy")
    );

    // Step 1: Parse + AI-categorize -> preview (nothing saved yet)
    public List<Map<String, Object>> preview(String email, String csvContent) {
        List<Map<String, Object>> rows = parse(csvContent);
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "No valid rows found. Expected columns: date, description, amount");
        }
        if (rows.size() > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Maximum 100 rows per import");
        }
        return categorizeWithAi(email, rows);
    }

    // Step 2: Confirmed rows -> bulk save
    public int importRows(String email, List<Map<String, Object>> rows) {
        User user = userRepository.findByEmail(email).orElseThrow();
        int saved = 0;

        for (Map<String, Object> row : rows) {
            Category category = null;
            Object catId = row.get("categoryId");
            if (catId != null && !catId.toString().isBlank()) {
                category = categoryRepository
                        .findByIdAndUserEmail(Long.valueOf(catId.toString()), email)
                        .orElse(null);
            }

            BigDecimal amount = new BigDecimal(row.get("amount").toString()).abs();
            Transaction tx = Transaction.builder()
                    .amount(amount)
                    .type(Transaction.Type.valueOf(row.get("type").toString()))
                    .description(row.get("description").toString())
                    .transactionDate(LocalDate.parse(row.get("date").toString()))
                    .category(category)
                    .user(user)
                    .build();
            transactionRepository.save(tx);
            saved++;
        }
        return saved;
    }

    private List<Map<String, Object>> parse(String csvContent) {
        List<Map<String, Object>> rows = new ArrayList<>();
        try (CSVReader reader = new CSVReader(new StringReader(csvContent))) {
            List<String[]> lines = reader.readAll();
            if (lines.isEmpty()) return rows;

            // Find columns from the header row (case-insensitive)
            String[] header = lines.get(0);
            int dateCol = -1, descCol = -1, amountCol = -1;
            for (int i = 0; i < header.length; i++) {
                String h = header[i].trim().toLowerCase();
                if (h.contains("date")) dateCol = i;
                else if (h.contains("desc") || h.contains("detail") || h.contains("narration")) descCol = i;
                else if (h.contains("amount") || h.contains("value")) amountCol = i;
            }
            if (dateCol == -1 || descCol == -1 || amountCol == -1) return rows;

            for (int i = 1; i < lines.size(); i++) {
                String[] line = lines.get(i);
                if (line.length <= Math.max(dateCol, Math.max(descCol, amountCol))) continue;
                try {
                    LocalDate date = parseDate(line[dateCol].trim());
                    String description = line[descCol].trim();
                    BigDecimal amount = new BigDecimal(
                            line[amountCol].trim().replace(",", "").replace("LKR", "").trim());
                    if (description.isBlank() || date == null) continue;

                    Map<String, Object> row = new HashMap<>();
                    row.put("date", date.toString());
                    row.put("description", description);
                    row.put("amount", amount.abs());
                    row.put("type", amount.signum() < 0 ? "EXPENSE" : "INCOME");
                    rows.add(row);
                } catch (Exception ignored) {
                    // skip unparseable rows — messy bank data is normal
                }
            }
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not parse CSV file");
        }
        return rows;
    }

    private LocalDate parseDate(String value) {
        for (DateTimeFormatter fmt : DATE_FORMATS) {
            try { return LocalDate.parse(value, fmt); } catch (Exception ignored) {}
        }
        return null;
    }

    // One AI call for the whole batch (not one per row!)
    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> categorizeWithAi(String email, List<Map<String, Object>> rows) {
        List<CategoryResponse> categories = categoryService.getAll(email);
        if (categories.isEmpty()) return rows;

        StringBuilder descriptions = new StringBuilder();
        for (int i = 0; i < rows.size(); i++) {
            descriptions.append(i).append(": ").append(rows.get(i).get("description")).append("\n");
        }
        String categoryList = categories.stream()
                .map(c -> c.id() + "=" + c.name())
                .reduce((a, b) -> a + ", " + b).orElse("");

        String prompt = """
                Categorize these bank transaction descriptions.
                Available categories (id=name): %s

                Transactions (index: description):
                %s

                Reply with ONLY a JSON object mapping each index to a category id,
                or null if nothing fits. Example: {"0": 3, "1": null, "2": 1}
                No markdown, no backticks, nothing else.
                """.formatted(categoryList, descriptions);

        try {
            String raw = geminiService.generate(prompt)
                    .replaceAll("```json", "").replaceAll("```", "").trim();
            Map<String, Object> mapping = new com.fasterxml.jackson.databind.ObjectMapper()
                    .readValue(raw, Map.class);

            for (int i = 0; i < rows.size(); i++) {
                Object catId = mapping.get(String.valueOf(i));
                if (catId != null) {
                    Long id = Long.valueOf(catId.toString());
                    boolean valid = categories.stream().anyMatch(c -> c.id().equals(id));
                    rows.get(i).put("categoryId", valid ? id : null);
                    rows.get(i).put("categoryName", valid
                            ? categories.stream().filter(c -> c.id().equals(id)).findFirst().get().name()
                            : null);
                }
            }
        } catch (Exception e) {
            // AI failure isn't fatal — rows just come back uncategorized
        }
        return rows;
    }
}