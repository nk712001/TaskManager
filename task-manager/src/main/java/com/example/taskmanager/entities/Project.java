package com.example.taskmanager.entities;

import jakarta.persistence.*;
import lombok.*;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "projects")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class Project {
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

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<Task> tasks = new HashSet<>();
    
    // Helper methods for bidirectional relationship
    public void addTask(Task task) {
        if (task != null) {
            tasks.add(task);
            task.setProject(this);
        }
    }
    
    public void removeTask(Task task) {
        if (task != null) {
            tasks.remove(task);
            task.setProject(null);
        }
    }
    
    // Ensure tasks collection is never null
    @PostLoad
    @PostPersist
    private void initialize() {
        if (tasks == null) {
            tasks = new HashSet<>();
        }
    }

    @Temporal(TemporalType.TIMESTAMP)
    @org.hibernate.annotations.CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private java.util.Date createdAt;
}
