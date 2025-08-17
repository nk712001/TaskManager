package com.example.taskmanager.repository;

import com.example.taskmanager.entities.Task;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long>, JpaSpecificationExecutor<Task> {
    
    @Query(value = """
        SELECT t.* FROM tasks t 
        WHERE (cast(:search as text) IS NULL OR 
               LOWER(t.title) LIKE LOWER(CONCAT('%', :search, '%')) OR 
               LOWER(t.description) LIKE LOWER(CONCAT('%', :search, '%')))
        AND (COALESCE(cast(:status as text), '') = '' OR t.status IN (:status))
        AND (COALESCE(cast(:priority as text), '') = '' OR t.priority IN (:priority))
        AND (cast(:assigneeId as bigint) IS NULL OR t.assignee_id = :assigneeId)
        AND (cast(:projectId as bigint) IS NULL OR t.project_id = :projectId)
        AND (cast(:dueDateFrom as date) IS NULL OR t.due_date >= :dueDateFrom)
        AND (cast(:dueDateTo as date) IS NULL OR t.due_date <= :dueDateTo)
    """, nativeQuery = true)
    Page<Task> findWithFilters(
        @Param("search") String search,
        @Param("status") List<String> status,
        @Param("priority") List<String> priority,
        @Param("assigneeId") Long assigneeId,
        @Param("projectId") Long projectId,
        @Param("dueDateFrom") LocalDate dueDateFrom,
        @Param("dueDateTo") LocalDate dueDateTo,
        Pageable pageable
    );
}
