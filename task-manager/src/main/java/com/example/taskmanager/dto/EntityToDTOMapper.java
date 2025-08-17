package com.example.taskmanager.dto;

import com.example.taskmanager.entities.*;
import java.util.Set;
import java.util.stream.Collectors;

public class EntityToDTOMapper {
    public static UserDTO toUserDTO(User user) {
        if (user == null) return null;
        Set<String> roles = user.getRoles() != null ? user.getRoles().stream().map(Role::getName).collect(Collectors.toSet()) : null;
        return new UserDTO(user.getId(), user.getUsername(), roles);
    }

    public static ProjectDTO toProjectDTO(Project project) {
        if (project == null) return null;
        Set<TaskDTO> tasks = project.getTasks() != null ? project.getTasks().stream().map(EntityToDTOMapper::toTaskDTO).collect(Collectors.toSet()) : null;
        Long ownerId = project.getOwner() != null ? project.getOwner().getId() : null;
        String ownerName = project.getOwner() != null ? project.getOwner().getUsername() : null;
        String createdAt = project.getCreatedAt() != null ? project.getCreatedAt().toInstant().toString() : null;
        ProjectDTO dto = new ProjectDTO(project.getId(), project.getName(), project.getDescription(), ownerId, tasks);
        dto.setOwnerName(ownerName);
        dto.setCreatedAt(createdAt);
        return dto;
    }

    public static TaskDTO toTaskDTO(Task task) {
        if (task == null) return null;
        
        Long projectId = task.getProject() != null ? task.getProject().getId() : null;
        Long creatorId = task.getCreator() != null ? task.getCreator().getId() : null;
        Long assigneeId = task.getAssignee() != null ? task.getAssignee().getId() : null;
        
        return new TaskDTO(
            task.getId(), 
            task.getTitle(), 
            task.getDescription(), 
            task.getStatus() != null ? task.getStatus().name() : null,
            task.getPriority() != null ? task.getPriority().name() : null,
            task.getDueDate(),
            creatorId,
            assigneeId,
            projectId
        );
    }
}
