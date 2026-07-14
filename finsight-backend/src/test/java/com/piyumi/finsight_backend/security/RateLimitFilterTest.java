package com.piyumi.finsight_backend.security;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class RateLimitFilterTest {

    @Test
    void blocksSixthLoginAttemptFromSameIp() throws Exception {
        RateLimitFilter filter = new RateLimitFilter();
        FilterChain chain = mock(FilterChain.class);

        for (int i = 0; i < 5; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/auth/login");
            req.setRemoteAddr("1.2.3.4");
            filter.doFilter(req, new MockHttpServletResponse(), chain);
        }
        verify(chain, times(5)).doFilter(any(), any());

        MockHttpServletRequest sixth = new MockHttpServletRequest("POST", "/api/auth/login");
        sixth.setRemoteAddr("1.2.3.4");
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(sixth, response, chain);

        assertThat(response.getStatus()).isEqualTo(429);
        verify(chain, times(5)).doFilter(any(), any()); // still 5 — sixth never passed
    }
}