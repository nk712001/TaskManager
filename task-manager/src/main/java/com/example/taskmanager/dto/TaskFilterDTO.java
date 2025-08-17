package com.example.taskmanager.dto;

import com.example.taskmanager.entities.Task;
import lombok.Data;

import java.time.LocalDate;


@Data
public class TaskFilterDTO {
    private String search;
    private Task.Status[] status;
    private Task.Priority[] priority;
    private Long assigneeId;
    private Long projectId;
    private LocalDate dueDateFrom;
    private LocalDate dueDateTo;
    private Integer page = 0;
    private Integer size = 10;
    
    public void setStatus(Task.Status[] status) {
        this.status = status != null && status.length > 0 ? status : null;
    }
    
    public void setPriority(Task.Priority[] priority) {
        this.priority = priority != null && priority.length > 0 ? priority : null;
    }
    
    public boolean hasFilters() {
        return search != null || 
               status != null || 
               priority != null || 
               assigneeId != null || 
               projectId != null || 
               dueDateFrom != null || 
               dueDateTo != null;
    }
}
