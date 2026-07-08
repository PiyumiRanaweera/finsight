package com.piyumi.finsight_backend.service;

import com.piyumi.finsight_backend.dto.TransactionRequest;
import com.piyumi.finsight_backend.dto.TransactionResponse;
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

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public List<TransactionResponse> getAll(String email, Integer year, Integer month) {
        List<Transaction> transactions;
        if (year != null && month != null) {
            YearMonth ym = YearMonth.of(year, month);
            transactions = transactionRepository
                    .findByUserEmailAndTransactionDateBetweenOrderByTransactionDateDesc(
                            email, ym.atDay(1), ym.atEndOfMonth());
        } else {
            transactions = transactionRepository.findByUserEmailOrderByTransactionDateDesc(email);
        }
        return transactions.stream().map(this::toResponse).toList();
    }

    public TransactionResponse create(String email, TransactionRequest request) {
        User user = userRepository.findByEmail(email).orElseThrow();
        Category category = resolveCategory(email, request.categoryId());

        Transaction tx = Transaction.builder()
                .amount(request.amount())
                .type(request.type())
                .description(request.description())
                .transactionDate(request.transactionDate())
                .category(category)
                .user(user)
                .build();
        transactionRepository.save(tx);
        return toResponse(tx);
    }

    public TransactionResponse update(String email, Long id, TransactionRequest request) {
        Transaction tx = transactionRepository.findByIdAndUserEmail(id, email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transaction not found"));
        tx.setAmount(request.amount());
        tx.setType(request.type());
        tx.setDescription(request.description());
        tx.setTransactionDate(request.transactionDate());
        tx.setCategory(resolveCategory(email, request.categoryId()));
        transactionRepository.save(tx);
        return toResponse(tx);
    }

    public void delete(String email, Long id) {
        Transaction tx = transactionRepository.findByIdAndUserEmail(id, email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transaction not found"));
        transactionRepository.delete(tx);
    }

    private Category resolveCategory(String email, Long categoryId) {
        if (categoryId == null) return null;
        return categoryRepository.findByIdAndUserEmail(categoryId, email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid category"));
    }

    private TransactionResponse toResponse(Transaction tx) {
        return new TransactionResponse(
                tx.getId(),
                tx.getAmount(),
                tx.getType(),
                tx.getDescription(),
                tx.getTransactionDate(),
                tx.getCategory() != null ? tx.getCategory().getId() : null,
                tx.getCategory() != null ? tx.getCategory().getName() : null
        );
    }
}