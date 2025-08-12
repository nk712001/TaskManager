package com.example.taskmanager.service;

import com.example.taskmanager.entities.User;
import com.example.taskmanager.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    private final com.example.taskmanager.repository.RoleRepository roleRepository;

    @Autowired
    public UserService(UserRepository userRepository,
                       org.springframework.security.crypto.password.PasswordEncoder passwordEncoder,
                       com.example.taskmanager.repository.RoleRepository roleRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.roleRepository = roleRepository;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public User createUser(User user) {
        // Assign default USER role if not set
        if (user.getRoles() == null || user.getRoles().isEmpty()) {
            com.example.taskmanager.entities.Role userRole = roleRepository.findByName("USER")
                .orElseGet(() -> {
                    com.example.taskmanager.entities.Role newRole = new com.example.taskmanager.entities.Role();
                    newRole.setName("USER");
                    return roleRepository.save(newRole);
                });
            java.util.Set<com.example.taskmanager.entities.Role> roles = new java.util.HashSet<>();
            roles.add(userRole);
            user.setRoles(roles);
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    public User updateUser(Long id, User updatedUser) {
        return userRepository.findById(id)
                .map(user -> {
                    user.setUsername(updatedUser.getUsername());
                    user.setPassword(updatedUser.getPassword());
                    user.setRoles(updatedUser.getRoles());
                    return userRepository.save(user);
                })
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
}
