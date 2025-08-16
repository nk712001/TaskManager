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

        // Load the existing project with its tasks
        Project existingProject = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + id));

        System.out.println("ProjectService: Found existing project - " +
                "Current Name: " + existingProject.getName() +
                ", Current Owner ID: "
                + (existingProject.getOwner() != null ? existingProject.getOwner().getId() : "null") +
                ", Task Count: " + (existingProject.getTasks() != null ? existingProject.getTasks().size() : 0));

        if (updatedProject.getTasks() != null) {
            existingProject.getTasks().clear();
            existingProject.getTasks().addAll(updatedProject.getTasks());
        }

        // Save and return the updated project
        Project savedProject = projectRepository.save(existingProject);
        System.out.println("ProjectService: Successfully updated project ID: " + savedProject.getId() +
                ", Task Count After Update: " + (savedProject.getTasks() != null ? savedProject.getTasks().size() : 0));
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
