package com.example.taskmanager.controller;

import com.example.taskmanager.dto.TaskDTO;
import com.example.taskmanager.dto.TaskFilterDTO;
import com.example.taskmanager.entities.Task;
import com.example.taskmanager.service.TaskService;
import com.example.taskmanager.dto.EntityToDTOMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/tasks")
public class TaskController {
    private final TaskService taskService;

    @Autowired
    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getTasks(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) List<String> status,
            @RequestParam(required = false) List<String> priority,
            @RequestParam(required = false) Long assigneeId,
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dueDateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dueDateTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
            
        TaskFilterDTO filterDTO = new TaskFilterDTO();
        filterDTO.setSearch(search);
        
        // Convert status strings to enums
        Task.Status[] statusEnums = null;
        if (status != null && !status.isEmpty()) {
            statusEnums = status.stream()
                .map(s -> Task.Status.valueOf(s.toUpperCase()))
                .toArray(Task.Status[]::new);
        }
        filterDTO.setStatus(statusEnums);
        
        // Convert priority strings to enums
        Task.Priority[] priorityEnums = null;
        if (priority != null && !priority.isEmpty()) {
            priorityEnums = priority.stream()
                .map(p -> Task.Priority.valueOf(p.toUpperCase()))
                .toArray(Task.Priority[]::new);
        }
        filterDTO.setPriority(priorityEnums);
        
        filterDTO.setAssigneeId(assigneeId);
        filterDTO.setProjectId(projectId);
        filterDTO.setDueDateFrom(dueDateFrom);
        filterDTO.setDueDateTo(dueDateTo);
        filterDTO.setPage(page);
        filterDTO.setSize(size);
        
        Page<Task> pageTasks = taskService.getTasksWithFilters(filterDTO);
        
        List<TaskDTO> tasks = pageTasks.getContent().stream()
                .map(EntityToDTOMapper::toTaskDTO)
                .collect(Collectors.toList());
                
        Map<String, Object> response = new HashMap<>();
        response.put("data", tasks);
        response.put("total", pageTasks.getTotalElements());
        response.put("page", pageTasks.getNumber());
        response.put("limit", pageTasks.getSize());
        response.put("totalPages", pageTasks.getTotalPages());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskDTO> getTaskById(@PathVariable Long id) {
        Optional<Task> taskOpt = taskService.getTaskById(id);
        return taskOpt.map(task -> ResponseEntity.ok(EntityToDTOMapper.toTaskDTO(task)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<TaskDTO> createTask(@RequestBody TaskDTO taskDTO) {
        try {
            Task task = new Task();
            task.setTitle(taskDTO.getTitle());
            task.setDescription(taskDTO.getDescription());
            task.setStatus(taskDTO.getStatus() != null ? Task.Status.valueOf(taskDTO.getStatus()) : null);
            task.setPriority(taskDTO.getPriority() != null ? Task.Priority.valueOf(taskDTO.getPriority()) : null);
            task.setDueDate(taskDTO.getDueDate());
            
            // These relationships will be set in the service layer
            Task created = taskService.createTask(task, taskDTO.getProjectId(), taskDTO.getCreatorId(), taskDTO.getAssigneeId());
            return ResponseEntity.ok(EntityToDTOMapper.toTaskDTO(created));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaskDTO> updateTask(@PathVariable Long id, @RequestBody TaskDTO taskDTO) {
        try {
            Task task = new Task();
            task.setTitle(taskDTO.getTitle());
            task.setDescription(taskDTO.getDescription());
            task.setStatus(taskDTO.getStatus() != null ? Task.Status.valueOf(taskDTO.getStatus()) : null);
            task.setPriority(taskDTO.getPriority() != null ? Task.Priority.valueOf(taskDTO.getPriority()) : null);
            task.setDueDate(taskDTO.getDueDate());
            
            Task updated = taskService.updateTask(id, task, taskDTO.getProjectId(), taskDTO.getAssigneeId());
            return ResponseEntity.ok(EntityToDTOMapper.toTaskDTO(updated));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }
}
