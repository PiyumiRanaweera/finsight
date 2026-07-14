package com.piyumi.finsight_backend.service;

import com.piyumi.finsight_backend.entity.Budget;
import com.piyumi.finsight_backend.entity.Category;
import com.piyumi.finsight_backend.entity.Transaction;
import com.piyumi.finsight_backend.entity.User;
import com.piyumi.finsight_backend.repository.BudgetRepository;
import com.piyumi.finsight_backend.repository.CategoryRepository;
import com.piyumi.finsight_backend.repository.TransactionRepository;
import com.piyumi.finsight_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    public List<Map<String, Object>> getAllWithProgress(String email) {
        YearMonth now = YearMonth.now();
        int dayOfMonth = LocalDate.now().getDayOfMonth();
        int daysInMonth = now.lengthOfMonth();

        List<Transaction> monthTxs = transactionRepository
                .findByUserEmailAndTransactionDateBetweenOrderByTransactionDateDesc(
                        email, now.atDay(1), now.atEndOfMonth());

        List<Map<String, Object>> result = new ArrayList<>();

        for (Budget b : budgetRepository.findByUserEmail(email)) {
            BigDecimal spent = monthTxs.stream()
                    .filter(t -> t.getType() == Transaction.Type.EXPENSE)
                    .filter(t -> t.getCategory() != null
                            && t.getCategory().getId().equals(b.getCategory().getId()))
                    .map(Transaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            // Projection: (spent / days elapsed) * days in month
            BigDecimal projected = dayOfMonth > 0
                    ? spent.divide(BigDecimal.valueOf(dayOfMonth), 2, RoundingMode.HALF_UP)
                           .multiply(BigDecimal.valueOf(daysInMonth))
                    : BigDecimal.ZERO;

            int percentUsed = b.getMonthlyLimit().signum() > 0
                    ? spent.multiply(BigDecimal.valueOf(100))
                           .divide(b.getMonthlyLimit(), 0, RoundingMode.DOWN).intValue()
                    : 0;

            String status;
            if (spent.compareTo(b.getMonthlyLimit()) > 0) status = "OVER";
            else if (projected.compareTo(b.getMonthlyLimit()) > 0) status = "AT_RISK";
            else status = "ON_TRACK";

            Map<String, Object> item = new HashMap<>();
            item.put("id", b.getId());
            item.put("categoryId", b.getCategory().getId());
            item.put("categoryName", b.getCategory().getName());
            item.put("monthlyLimit", b.getMonthlyLimit());
            item.put("spent", spent);
            item.put("projected", projected.setScale(0, RoundingMode.HALF_UP));
            item.put("percentUsed", Math.min(percentUsed, 100));
            item.put("status", status);
            result.add(item);
        }
        return result;
    }

    public void upsert(String email, Long categoryId, BigDecimal monthlyLimit) {
        if (monthlyLimit == null || monthlyLimit.signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Limit must be positive");
        }
        Category category = categoryRepository.findByIdAndUserEmail(categoryId, email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid category"));

        Budget budget = budgetRepository.findByCategoryIdAndUserEmail(categoryId, email)
                .orElseGet(() -> {
                    User user = userRepository.findByEmail(email).orElseThrow();
                    return Budget.builder().category(category).user(user).build();
                });
        budget.setMonthlyLimit(monthlyLimit);
        budgetRepository.save(budget);
    }

    public void delete(String email, Long id) {
        Budget budget = budgetRepository.findByIdAndUserEmail(id, email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Budget not found"));
        budgetRepository.delete(budget);
    }
}