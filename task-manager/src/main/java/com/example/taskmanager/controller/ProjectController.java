package com.example.taskmanager.controller;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody; 
import com.example.taskmanager.service.ProjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import com.example.taskmanager.dto.ProjectDTO;
import com.example.taskmanager.dto.EntityToDTOMapper;
import com.example.taskmanager.entities.Project;
import com.example.taskmanager.entities.Task;
import com.example.taskmanager.dto.TaskDTO;
import com.example.taskmanager.service.TaskService;

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
        org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(ProjectController.class);
        logger.info("ProjectController: createProject called");
        logger.info("ProjectController: createProject called for project name {} by owner {}", project.getName(), project.getOwner() != null ? project.getOwner().getId() : null);
        Project created = projectService.createProject(project);
        return ResponseEntity.ok(EntityToDTOMapper.toProjectDTO(created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProjectDTO> updateProject(@PathVariable Long id, @RequestBody Project project) {
        try {
            Project updated = projectService.updateProject(id, project);
            return ResponseEntity.ok(EntityToDTOMapper.toProjectDTO(updated));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
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
    public ResponseEntity<TaskDTO> createTaskForProject(@PathVariable Long projectId, @RequestBody @jakarta.validation.Valid TaskDTO taskDTO) {
        Optional<Project> projectOpt = projectService.getProjectById(projectId);
        if (projectOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Project project = projectOpt.get();
        Task task = new Task();
        task.setTitle(taskDTO.getTitle());
        task.setDescription(taskDTO.getDescription());
        task.setStatus(Task.Status.valueOf(taskDTO.getStatus() != null ? taskDTO.getStatus() : "PENDING"));
        task.setProject(project);
        Task created = taskService.createTask(task);
        return ResponseEntity.ok(EntityToDTOMapper.toTaskDTO(created));
    }
}
