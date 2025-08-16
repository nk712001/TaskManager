package com.example.taskmanager.service;

import com.example.taskmanager.entities.Project;
import com.example.taskmanager.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

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

    public Project updateProject(Long id, Project updatedProject) {
        System.out.println("ProjectService: Starting update for project ID: " + id);
        
        return projectRepository.findById(id)
                .map(project -> {
                    System.out.println("ProjectService: Found existing project - " + 
                        "Current Name: " + project.getName() + 
                        ", Current Owner ID: " + (project.getOwner() != null ? project.getOwner().getId() : "null"));
                    
                    // Log changes
                    if (!project.getName().equals(updatedProject.getName())) {
                        System.out.println("ProjectService: Updating name from '" + project.getName() + "' to '" + updatedProject.getName() + "'");
                    }
                    if (!project.getDescription().equals(updatedProject.getDescription())) {
                        System.out.println("ProjectService: Updating description");
                    }
                    if (project.getOwner() == null || 
                        updatedProject.getOwner() == null || 
                        !project.getOwner().getId().equals(updatedProject.getOwner().getId())) {
                        System.out.println("ProjectService: Changing owner from " + 
                            (project.getOwner() != null ? project.getOwner().getId() : "null") + 
                            " to " + (updatedProject.getOwner() != null ? updatedProject.getOwner().getId() : "null"));
                    }
                    
                    project.setName(updatedProject.getName());
                    project.setDescription(updatedProject.getDescription());
                    project.setOwner(updatedProject.getOwner());
                    project.setTasks(updatedProject.getTasks());
                    
                    Project savedProject = projectRepository.save(project);
                    System.out.println("ProjectService: Successfully updated project ID: " + savedProject.getId());
                    return savedProject;
                })
                .orElseThrow(() -> {
                    System.err.println("ProjectService: Project not found with ID: " + id);
                    return new RuntimeException("Project not found with ID: " + id);
                });
    }

    public void deleteProject(Long id) {
        projectRepository.deleteById(id);
    }
}
