package com.example.taskmanager;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class TaskManagerApplication {
    public static void main(String[] args) {
        System.out.println("DEBUG: TaskManagerApplication started at " + java.time.Instant.now());
        SpringApplication.run(TaskManagerApplication.class, args);
    }
}
