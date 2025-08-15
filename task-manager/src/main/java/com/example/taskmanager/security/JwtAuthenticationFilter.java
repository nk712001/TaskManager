package com.example.taskmanager.security;

import com.example.taskmanager.entities.User;
import com.example.taskmanager.repository.UserRepository;
import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    @Autowired
    private JwtUtil jwtUtil;
    @Autowired
    private UserRepository userRepository;

    @Override
    protected void doFilterInternal(@org.springframework.lang.NonNull HttpServletRequest request, @org.springframework.lang.NonNull HttpServletResponse response, @org.springframework.lang.NonNull FilterChain filterChain)
            throws ServletException, IOException {
        String jwt = getJwtFromRequest(request);
        if (StringUtils.hasText(jwt)) {
            try {
                String username = jwtUtil.getUsernameFromToken(jwt);
                if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    User user = userRepository.findByUsername(username).orElse(null);
                    if (user != null && jwtUtil.validateToken(jwt, username)) {
    // Extract roles from JWT and map to authorities
    java.util.List<String> roles = jwtUtil.getClaimFromToken(jwt, claims -> claims.get("roles", java.util.List.class));
    java.util.List<org.springframework.security.core.authority.SimpleGrantedAuthority> authorities = roles != null
        ? roles.stream().map(org.springframework.security.core.authority.SimpleGrantedAuthority::new).toList()
        : java.util.Collections.emptyList();
    System.out.println("JWT roles: " + roles);
    System.out.println("Authorities set: " + authorities);
    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
        user, null, authorities
    );
    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
    SecurityContextHolder.getContext().setAuthentication(authentication);
}
                }
            } catch (ExpiredJwtException ex) {
                // Optionally handle expired token
            } catch (Exception ex) {
                // Optionally handle invalid token
            }
        }
        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
