package com.example.taskmanager.controller;

import com.example.taskmanager.dto.ProjectDTO;
import com.example.taskmanager.dto.TaskDTO;
import com.example.taskmanager.dto.EntityToDTOMapper;
import com.example.taskmanager.entities.Project;
import com.example.taskmanager.entities.Task;
import com.example.taskmanager.entities.User;
import com.example.taskmanager.service.ProjectService;
import com.example.taskmanager.service.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/projects")
public class ProjectController {
    private final ProjectService projectService;
    private final TaskService taskService;

    @Autowired
    public ProjectController(ProjectService projectService, TaskService taskService) {
        this.projectService = projectService;
        this.taskService = taskService;
    }

    @GetMapping
    public List<ProjectDTO> getAllProjects() {
        return projectService.getAllProjects()
                .stream()
                .map(EntityToDTOMapper::toProjectDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectDTO> getProjectById(@PathVariable Long id) {
        Optional<Project> projectOpt = projectService.getProjectById(id);
        return projectOpt.map(project -> ResponseEntity.ok(EntityToDTOMapper.toProjectDTO(project)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @PostMapping
    public ResponseEntity<ProjectDTO> createProject(@RequestBody Project project) {
        Project created = projectService.createProject(project);
        return ResponseEntity.ok(EntityToDTOMapper.toProjectDTO(created));
    }

    @SuppressWarnings("unchecked")
    @PutMapping("/{id}")
    public ResponseEntity<ProjectDTO> updateProject(
            @PathVariable String id,
            @RequestBody Map<String, Object> updates) {
        try {
            System.out.println("ProjectController: Received update request for project ID: " + id);
            System.out.println("ProjectController: Update data: " + updates);

            // Convert string ID to Long
            Long projectId;
            try {
                projectId = Long.parseLong(id);
            } catch (NumberFormatException e) {
                System.err.println("ProjectController: Invalid project ID format: " + id);
                return ResponseEntity.badRequest().build();
            }

            // Get the existing project
            Project existingProject = projectService.getProjectById(projectId)
                    .orElseThrow(() -> new RuntimeException("Project not found with id: " + projectId));

            // Update only the fields that are present in the request
            if (updates.containsKey("name")) {
                existingProject.setName((String) updates.get("name"));
            }
            if (updates.containsKey("description")) {
                existingProject.setDescription((String) updates.get("description"));
            }
            if (updates.containsKey("owner") && updates.get("owner") != null) {
                Map<String, Object> ownerMap = (Map<String, Object>) updates.get("owner");
                if (ownerMap.containsKey("id")) {
                    Long ownerId = Long.parseLong(ownerMap.get("id").toString());
                    User owner = new User();
                    owner.setId(ownerId);
                    existingProject.setOwner(owner);
                }
            }

            // Save the updated project
            Project updated = projectService.updateProject(projectId, existingProject);

            System.out.println("ProjectController: Successfully updated project ID: " + projectId);
            return ResponseEntity.ok(EntityToDTOMapper.toProjectDTO(updated));

        } catch (NumberFormatException e) {
            System.err.println("ProjectController: Number format exception: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            System.err.println("ProjectController: Error updating project ID: " + id + ". Error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{projectId}/tasks")
    public ResponseEntity<List<TaskDTO>> getTasksByProject(@PathVariable Long projectId) {
        Optional<Project> projectOpt = projectService.getProjectById(projectId);
        if (projectOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        List<TaskDTO> tasks = projectOpt.get().getTasks()
                .stream()
                .map(EntityToDTOMapper::toTaskDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(tasks);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{projectId}/tasks")
    public ResponseEntity<TaskDTO> createTaskForProject(
            @PathVariable Long projectId,
            @RequestBody @jakarta.validation.Valid TaskDTO taskDTO) {

        // Validate project exists
        if (!projectService.getProjectById(projectId).isPresent()) {
            return ResponseEntity.notFound().build();
        }

        // Validate required fields
        if (taskDTO.getCreatorId() == null) {
            return ResponseEntity.badRequest().build();
        }

        try {
            // Create task entity from DTO
            Task task = new Task();
            task.setTitle(taskDTO.getTitle());
            task.setDescription(taskDTO.getDescription());

            // Set status with default
            String status = taskDTO.getStatus() != null ? taskDTO.getStatus() : "PENDING";
            task.setStatus(Task.Status.valueOf(status));

            // Set priority if provided
            if (taskDTO.getPriority() != null) {
                task.setPriority(Task.Priority.valueOf(taskDTO.getPriority()));
            }

            task.setDueDate(taskDTO.getDueDate());

            // Create task via service
            Task created = taskService.createTask(
                    task,
                    projectId,
                    taskDTO.getCreatorId(),
                    taskDTO.getAssigneeId());

            return ResponseEntity.ok(EntityToDTOMapper.toTaskDTO(created));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }

    }
}
