    package com.example.taskmanager.service;

import com.example.taskmanager.entities.Project;
import com.example.taskmanager.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import com.example.taskmanager.entities.Task;

@Service
public class ProjectService {
    private final ProjectRepository projectRepository;

    @Autowired
    public ProjectService(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }

    public Optional<Project> getProjectById(Long id) {
        return projectRepository.findById(id);
    }

    public Project createProject(Project project) {
        return projectRepository.save(project);
    }

    @Transactional
    public Project updateProject(Long id, Project updatedProject) {
        System.out.println("ProjectService: Starting update for project ID: " + id);
        
        return projectRepository.findById(id)
                .map(project -> {
                    System.out.println("ProjectService: Found existing project - " + 
                        "Current Name: " + project.getName() + 
                        ", Current Owner ID: " + (project.getOwner() != null ? project.getOwner().getId() : "null"));
                    
                    // Update basic fields
                    project.setName(updatedProject.getName());
                    project.setDescription(updatedProject.getDescription());
                    
                    // Only update owner if it's provided in the updated project
                    if (updatedProject.getOwner() != null) {
                        System.out.println("ProjectService: Updating owner to ID: " + updatedProject.getOwner().getId());
                        project.setOwner(updatedProject.getOwner());
                    }
                    
                    // Don't update tasks collection here - manage tasks through TaskService
                    // This prevents Hibernate collection reference issues
                    
                    Project savedProject = projectRepository.save(project);
                    System.out.println("ProjectService: Successfully updated project ID: " + savedProject.getId());
                    return savedProject;
                })
                .orElseThrow(() -> {
                    System.err.println("ProjectService: Project not found with ID: " + id);
                    return new RuntimeException("Project not found with ID: " + id);
                });
    }

    @Transactional
    public void deleteProject(Long id) {
        if (!projectRepository.existsById(id)) {
            throw new RuntimeException("Project not found with ID: " + id);
        }
        projectRepository.deleteById(id);
    }
}
