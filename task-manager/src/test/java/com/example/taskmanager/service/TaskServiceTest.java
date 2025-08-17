package com.example.taskmanager.service;

import com.example.taskmanager.entities.Task;
import com.example.taskmanager.entities.User;
import com.example.taskmanager.entities.Project;
import com.example.taskmanager.repository.TaskRepository;
import com.example.taskmanager.repository.UserRepository;
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

class TaskServiceTest {
    @Mock
    private TaskRepository taskRepository;
    
    @Mock
    private UserRepository userRepository;
    
    @Mock
    private ProjectRepository projectRepository;

    @InjectMocks
    private TaskService taskService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testGetAllTasks() {
        Task t1 = new Task();
        Task t2 = new Task();
        when(taskRepository.findAll()).thenReturn(Arrays.asList(t1, t2));
        List<Task> tasks = taskService.getAllTasks();
        assertEquals(2, tasks.size());
    }

    @Test
    void testGetTaskById() {
        Task task = new Task();
        task.setId(1L);
        when(taskRepository.findById(1L)).thenReturn(Optional.of(task));
        Optional<Task> found = taskService.getTaskById(1L);
        assertTrue(found.isPresent());
        assertEquals(1L, found.get().getId());
    }

    @Test
    void testCreateTask() {
        // Given
        Task task = new Task();
        task.setTitle("Test Task");
        
        User creator = new User();
        creator.setId(1L);
        
        Project project = new Project();
        project.setId(1L);
        
        when(userRepository.findById(1L)).thenReturn(Optional.of(creator));
        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));
        when(taskRepository.save(task)).thenReturn(task);
        
        // When
        Task created = taskService.createTask(task, 1L, 1L, 2L);
        
        // Then
        assertNotNull(created);
        assertEquals("Test Task", created.getTitle());
        assertEquals(creator, created.getCreator());
        assertEquals(project, created.getProject());
    }

    @Test
    void testUpdateTask() {
        // Given
        Task existingTask = new Task();
        existingTask.setId(1L);
        existingTask.setTitle("old");
        
        Task updatedTask = new Task();
        updatedTask.setTitle("new");
        
        User assignee = new User();
        assignee.setId(2L);
        
        Project project = new Project();
        project.setId(1L);
        
        when(taskRepository.findById(1L)).thenReturn(Optional.of(existingTask));
        when(userRepository.findById(2L)).thenReturn(Optional.of(assignee));
        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));
        when(taskRepository.save(any(Task.class))).thenReturn(existingTask);
        
        // When
        Task result = taskService.updateTask(1L, updatedTask, 1L, 2L);
        
        // Then
        assertEquals("new", result.getTitle());
        assertEquals(assignee, result.getAssignee());
        assertEquals(project, result.getProject());
    }

    @Test
    void testDeleteTask() {
        taskService.deleteTask(1L);
        verify(taskRepository, times(1)).deleteById(1L);
    }
}
