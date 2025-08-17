package com.example.taskmanager.dto;

import com.example.taskmanager.entities.Task;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

public class TaskDTO {
    private Long id;
    
    @NotBlank(message = "Task title is required")
    @Size(max = 100, message = "Task title cannot exceed 100 characters")
    private String title;

    @Size(max = 1024, message = "Description cannot exceed 1024 characters")
    private String description;

    @NotBlank(message = "Status is required")
    private String status;

    private String priority;
    
    private LocalDateTime dueDate;

    @NotNull(message = "Creator ID is required")
    private Long creatorId;
    
    private Long assigneeId;
    
    private Long projectId;

    public TaskDTO() {}

    public TaskDTO(Long id, String title, String description, String status, 
                  String priority, LocalDateTime dueDate, Long creatorId, 
                  Long assigneeId, Long projectId) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.status = status;
        this.priority = priority;
        this.dueDate = dueDate;
        this.creatorId = creatorId;
        this.assigneeId = assigneeId;
        this.projectId = projectId;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    
    public LocalDateTime getDueDate() { return dueDate; }
    public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }
    
    public Long getCreatorId() { return creatorId; }
    public void setCreatorId(Long creatorId) { this.creatorId = creatorId; }
    
    public Long getAssigneeId() { return assigneeId; }
    public void setAssigneeId(Long assigneeId) { this.assigneeId = assigneeId; }
    
    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
}
