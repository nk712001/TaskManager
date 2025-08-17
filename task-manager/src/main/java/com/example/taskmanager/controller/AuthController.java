package com.example.taskmanager.controller;

import com.example.taskmanager.dto.UserDTO;
import com.example.taskmanager.entities.User;
import com.example.taskmanager.service.UserService;
import com.example.taskmanager.dto.EntityToDTOMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import com.example.taskmanager.security.JwtUtil;
import com.example.taskmanager.security.CustomUserDetailsService;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(AuthController.class);
    private final UserService userService;

    @Autowired
    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<UserDTO> register(@RequestBody User user) {
        User created = userService.createUser(user);
        return ResponseEntity.ok(EntityToDTOMapper.toUserDTO(created));
    }

    @Autowired
    private AuthenticationManager authenticationManager;
    @Autowired
    private JwtUtil jwtUtil;
    @Autowired
    private CustomUserDetailsService customUserDetailsService;

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody User user) {
        logger.info("DEBUG: LOGIN CONTROLLER REACHED for username: {}", user.getUsername());
        logger.info("DEBUG: Attempting login for username: {}", user.getUsername());
        try {
            // Authenticate user
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getUsername(), user.getPassword())
            );
            
            // Get the principal (user details)
            org.springframework.security.core.userdetails.User principal = 
                (org.springframework.security.core.userdetails.User) authentication.getPrincipal();
            
            // Get user roles
            java.util.List<String> roles = principal.getAuthorities().stream()
                .map(org.springframework.security.core.GrantedAuthority::getAuthority)
                .collect(java.util.stream.Collectors.toList());
                
            // Get the full user details to get the numeric ID
            Optional<com.example.taskmanager.entities.User> userOpt = 
                userService.getUserByUsername(user.getUsername());
                
            if (!userOpt.isPresent()) {
                logger.error("User not found after successful authentication: {}", user.getUsername());
                return ResponseEntity.status(500).body("User data not found");
            }
            
            com.example.taskmanager.entities.User fullUser = userOpt.get();
            
            logger.info("DEBUG: User roles on login: {}", roles);
            
            // Generate token with username, user ID, and roles
            String jwt = jwtUtil.generateToken(
                principal.getUsername(), 
                fullUser.getId(), 
                roles
            );
            
            logger.info("DEBUG: JWT issued for user ID: {}", fullUser.getId());
            return ResponseEntity.ok(jwt);
            
        } catch (Exception e) {
            logger.error("DEBUG: Login failed for username: {} - {}", user.getUsername(), e.getMessage(), e);
            return ResponseEntity.status(401).body("Invalid username or password");
        }
    }
}
