package com.example.taskmanager.dto;

import com.example.taskmanager.entities.*;
import org.junit.jupiter.api.Test;
import java.util.Collections;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class EntityToDTOMapperTest {
    @Test
    void testUserToUserDTO() {
        Role role = new Role();
        role.setId(1L);
        role.setName("ADMIN");
        User user = new User();
        user.setId(42L);
        user.setUsername("testuser");
        user.setRoles(Set.of(role));

        UserDTO dto = EntityToDTOMapper.toUserDTO(user);
        assertEquals(user.getId(), dto.getId());
        assertEquals(user.getUsername(), dto.getUsername());
        assertTrue(dto.getRoles().contains("ADMIN"));
    }

    @Test
    void testProjectToProjectDTO() {
        User owner = new User();
        owner.setId(99L);
        Project project = new Project();
        project.setId(100L);
        project.setName("Test Project");
        project.setDescription("Desc");
        project.setOwner(owner);
        project.setTasks(Collections.emptySet());

        ProjectDTO dto = EntityToDTOMapper.toProjectDTO(project);
        assertEquals(project.getId(), dto.getId());
        assertEquals(project.getName(), dto.getName());
        assertEquals(project.getDescription(), dto.getDescription());
        assertEquals(owner.getId(), dto.getOwnerId());
        assertNotNull(dto.getTasks());
    }

    @Test
    void testTaskToTaskDTO() {
        Project project = new Project();
        project.setId(200L);
        Task task = new Task();
        task.setId(300L);
        task.setTitle("Task Title");
        task.setDescription("Task Desc");
        task.setStatus(Task.Status.IN_PROGRESS);
        task.setProject(project);

        TaskDTO dto = EntityToDTOMapper.toTaskDTO(task);
        assertEquals(task.getId(), dto.getId());
        assertEquals(task.getTitle(), dto.getTitle());
        assertEquals(task.getDescription(), dto.getDescription());
        assertEquals("IN_PROGRESS", dto.getStatus());
        assertEquals(project.getId(), dto.getProjectId());
    }
}
