package com.example.taskmanager.controller;

import com.example.taskmanager.dto.UserDTO;
import com.example.taskmanager.entities.User;
import com.example.taskmanager.service.UserService;
import com.example.taskmanager.dto.EntityToDTOMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
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

    // Placeholder for login endpoint (JWT logic to be added in security step)
    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody User user) {
        // JWT authentication logic goes here
        return ResponseEntity.ok("JWT token placeholder");
    }
}
