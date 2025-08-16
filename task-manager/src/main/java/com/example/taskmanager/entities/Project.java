package com.example.taskmanager.entities;

import jakarta.persistence.*;
import lombok.*;
import java.io.Serializable;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "projects")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class Project implements Serializable {
    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(length = 1024)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private Set<Task> tasks = new HashSet<>();
    
    // Helper methods for bidirectional relationship
    public void addTask(Task task) {
        if (task != null) {
            getTasks().add(task);
            task.setProject(this);
        }
    }
    
    public void removeTask(Task task) {
        if (task != null) {
            getTasks().remove(task);
            task.setProject(null);
        }
    }
    
    // Use getter to ensure collection is initialized
    public Set<Task> getTasks() {
        if (tasks == null) {
            tasks = new HashSet<>();
        }
        return tasks;
    }
    
    // Custom setter to handle collection updates properly
    public void setTasks(Set<Task> newTasks) {
        if (newTasks == null) {
            if (this.tasks != null) {
                this.tasks.clear();
            }
        } else {
            if (this.tasks == null) {
                this.tasks = new HashSet<>(newTasks);
            } else {
                this.tasks.clear();
                this.tasks.addAll(newTasks);
            }
            // Update the back reference
            for (Task task : this.tasks) {
                task.setProject(this);
            }
        }
    }

    @Temporal(TemporalType.TIMESTAMP)
    @org.hibernate.annotations.CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private java.util.Date createdAt;
}
