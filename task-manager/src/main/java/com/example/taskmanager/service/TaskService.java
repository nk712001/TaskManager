package com.example.taskmanager.service;

import com.example.taskmanager.dto.TaskFilterDTO;
import com.example.taskmanager.entities.Task;
import com.example.taskmanager.entities.User;
import com.example.taskmanager.entities.Project;
import com.example.taskmanager.repository.TaskRepository;
import com.example.taskmanager.repository.UserRepository;
import com.example.taskmanager.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
@Transactional
public class TaskService {
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;

    @Autowired
    public TaskService(TaskRepository taskRepository, 
                      UserRepository userRepository,
                      ProjectRepository projectRepository) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
    }

    public Page<Task> getTasksWithFilters(TaskFilterDTO filterDTO) {
        // Handle search term
        String searchTerm = filterDTO.getSearch() != null && !filterDTO.getSearch().isEmpty() ? 
            filterDTO.getSearch() : null;
            
        // Handle status list
        List<String> statusList = null;
        if (filterDTO.getStatus() != null && filterDTO.getStatus().length > 0) {
            statusList = Arrays.stream(filterDTO.getStatus())
                .filter(Objects::nonNull)
                .map(Enum::name)
                .toList();
            if (statusList.isEmpty()) {
                statusList = null;
            }
        }
        
        // Handle priority list
        List<String> priorityList = null;
        if (filterDTO.getPriority() != null && filterDTO.getPriority().length > 0) {
            priorityList = Arrays.stream(filterDTO.getPriority())
                .filter(Objects::nonNull)
                .map(Enum::name)
                .toList();
            if (priorityList.isEmpty()) {
                priorityList = null;
            }
        }
        
        // Handle assignee and project IDs
        Long assigneeId = filterDTO.getAssigneeId();
        Long projectId = filterDTO.getProjectId();
        
        // Handle date ranges
        LocalDate dueDateFrom = filterDTO.getDueDateFrom();
        LocalDate dueDateTo = filterDTO.getDueDateTo();
        
        // Create page request
        int page = filterDTO.getPage() != null ? filterDTO.getPage() : 0;
        int size = filterDTO.getSize() != null ? filterDTO.getSize() : 10;
        PageRequest pageRequest = PageRequest.of(page, size);
        
        // Call repository with proper null handling
        return taskRepository.findWithFilters(
            searchTerm,
            statusList,
            priorityList,
            assigneeId,
            projectId,
            dueDateFrom,
            dueDateTo,
            pageRequest
        );
    }
    
    @Deprecated
    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }

    public Optional<Task> getTaskById(Long id) {
        return taskRepository.findById(id);
    }

    @Transactional
    public Task createTask(Task task, Long projectId, Long creatorId, Long assigneeId) {
        // Set creator
        User creator = userRepository.findById(creatorId)
            .orElseThrow(() -> new RuntimeException("Creator not found with id: " + creatorId));
        task.setCreator(creator);
        
        // Set assignee if provided
        if (assigneeId != null) {
            User assignee = userRepository.findById(assigneeId)
                .orElseThrow(() -> new RuntimeException("Assignee not found with id: " + assigneeId));
            task.setAssignee(assignee);
        }
        
        // Set project if provided
        if (projectId != null) {
            Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + projectId));
            task.setProject(project);
        }
        
        return taskRepository.save(task);
    }

    @Transactional
    public Task updateTask(Long id, Task task, Long projectId, Long assigneeId) {
        Task existingTask = taskRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Task not found with id: " + id));
        
        // Update basic fields
        existingTask.setTitle(task.getTitle());
        existingTask.setDescription(task.getDescription());
        existingTask.setStatus(task.getStatus());
        existingTask.setPriority(task.getPriority());
        existingTask.setDueDate(task.getDueDate());
        
        // Update assignee if provided
        if (assigneeId != null) {
            User assignee = userRepository.findById(assigneeId)
                .orElseThrow(() -> new RuntimeException("Assignee not found with id: " + assigneeId));
            existingTask.setAssignee(assignee);
        } else {
            existingTask.setAssignee(null);
        }
        
        // Update project if provided
        if (projectId != null) {
            Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + projectId));
            existingTask.setProject(project);
        } else {
            existingTask.setProject(null);
        }
        
        return taskRepository.save(existingTask);
    }

    public void deleteTask(Long id) {
        taskRepository.deleteById(id);
    }
}
