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
        
        Project existingProject = projectRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Project not found with id: " + id));
            
        System.out.println("ProjectService: Found existing project - " + 
            "Current Name: " + existingProject.getName() + 
            ", Current Owner ID: " + (existingProject.getOwner() != null ? existingProject.getOwner().getId() : "null"));
        
        // Only update the fields we want to allow updating
        existingProject.setName(updatedProject.getName());
        existingProject.setDescription(updatedProject.getDescription());
        
        // Only update owner if it's provided in the updated project
        if (updatedProject.getOwner() != null) {
            System.out.println("ProjectService: Updating owner to ID: " + updatedProject.getOwner().getId());
            existingProject.setOwner(updatedProject.getOwner());
        }
        
        // Explicitly save the changes
        Project savedProject = projectRepository.save(existingProject);
        System.out.println("ProjectService: Successfully updated project ID: " + savedProject.getId());
        return savedProject;
    }

    @Transactional
    public void deleteProject(Long id) {
        if (!projectRepository.existsById(id)) {
            throw new RuntimeException("Project not found with ID: " + id);
        }
        projectRepository.deleteById(id);
    }
}
