package com.piyumi.finsight_backend.service;

import com.piyumi.finsight_backend.dto.GoalRequest;
import com.piyumi.finsight_backend.dto.GoalResponse;
import com.piyumi.finsight_backend.entity.Goal;
import com.piyumi.finsight_backend.entity.User;
import com.piyumi.finsight_backend.repository.GoalRepository;
import com.piyumi.finsight_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GoalService {

    private final GoalRepository goalRepository;
    private final UserRepository userRepository;

    public List<GoalResponse> getAll(String email) {
        return goalRepository.findByUserEmail(email).stream().map(this::toResponse).toList();
    }

    public GoalResponse create(String email, GoalRequest request) {
        User user = userRepository.findByEmail(email).orElseThrow();
        Goal goal = Goal.builder()
                .name(request.name())
                .emoji(request.emoji())
                .targetAmount(request.targetAmount())
                .savedAmount(BigDecimal.ZERO)
                .deadline(request.deadline())
                .user(user)
                .build();
        goalRepository.save(goal);
        return toResponse(goal);
    }

    public GoalResponse addMoney(String email, Long id, BigDecimal amount) {
        if (amount == null || amount.signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Amount must be positive");
        }
        Goal goal = findOwned(email, id);
        goal.setSavedAmount(goal.getSavedAmount().add(amount));
        goalRepository.save(goal);
        return toResponse(goal);
    }

    public void delete(String email, Long id) {
        goalRepository.delete(findOwned(email, id));
    }

    private Goal findOwned(String email, Long id) {
        return goalRepository.findByIdAndUserEmail(id, email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Goal not found"));
    }

    private GoalResponse toResponse(Goal g) {
        int pct = g.getTargetAmount().signum() > 0
                ? g.getSavedAmount()
                    .multiply(BigDecimal.valueOf(100))
                    .divide(g.getTargetAmount(), 0, RoundingMode.DOWN)
                    .min(BigDecimal.valueOf(100))
                    .intValue()
                : 0;
        return new GoalResponse(g.getId(), g.getName(), g.getEmoji(),
                g.getTargetAmount(), g.getSavedAmount(), g.getDeadline(), pct);
    }
}