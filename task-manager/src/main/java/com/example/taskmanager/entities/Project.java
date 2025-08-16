package com.example.taskmanager.entities;

import jakarta.persistence.*;
import lombok.*;
import java.io.Serializable;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "projects")
@Getter
@Setter
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
            this.tasks.add(task);
            task.setProject(this);
        }
    }
    
    public void removeTask(Task task) {
        if (task != null) {
            task.setProject(null);
            this.tasks.remove(task);
        }
    }
    
    // This is important to prevent Hibernate from replacing the collection
    public void setTasks(Set<Task> tasks) {
        if (this.tasks == null) {
            this.tasks = tasks;
        } else if (this.tasks != tasks) { // not the same instance
            this.tasks.clear();
            if (tasks != null) {
                this.tasks.addAll(tasks);
                tasks.forEach(task -> task.setProject(this));
            }
        }
    }

    @Temporal(TemporalType.TIMESTAMP)
    @org.hibernate.annotations.CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private java.util.Date createdAt;
}
