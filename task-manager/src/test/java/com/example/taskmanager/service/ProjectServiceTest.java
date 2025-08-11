package com.example.taskmanager.service;

import com.example.taskmanager.entities.Project;
import com.example.taskmanager.repository.ProjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ProjectServiceTest {
    @Mock
    private ProjectRepository projectRepository;

    @InjectMocks
    private ProjectService projectService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testGetAllProjects() {
        Project p1 = new Project();
        Project p2 = new Project();
        when(projectRepository.findAll()).thenReturn(Arrays.asList(p1, p2));
        List<Project> projects = projectService.getAllProjects();
        assertEquals(2, projects.size());
    }

    @Test
    void testGetProjectById() {
        Project project = new Project();
        project.setId(1L);
        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));
        Optional<Project> found = projectService.getProjectById(1L);
        assertTrue(found.isPresent());
        assertEquals(1L, found.get().getId());
    }

    @Test
    void testCreateProject() {
        Project project = new Project();
        when(projectRepository.save(project)).thenReturn(project);
        Project created = projectService.createProject(project);
        assertNotNull(created);
    }

    @Test
    void testUpdateProject() {
        Project project = new Project();
        project.setId(1L);
        project.setName("old");
        Project updated = new Project();
        updated.setName("new");
        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));
        when(projectRepository.save(any(Project.class))).thenReturn(project);
        Project result = projectService.updateProject(1L, updated);
        assertEquals("new", result.getName());
    }

    @Test
    void testDeleteProject() {
        projectService.deleteProject(1L);
        verify(projectRepository, times(1)).deleteById(1L);
    }
}
