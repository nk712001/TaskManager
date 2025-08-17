import api from './axios';

export const fetchDashboardStats = async () => {
  try {
    // Option 1: If backend provides a dashboard stats endpoint, use it:
    // const { data } = await api.get('/v1/dashboard/stats');
    // return data;

    // Option 2: Otherwise, fetch projects and tasks and aggregate on frontend
    const [projectsRes, tasksRes] = await Promise.all([
      api.get('/v1/projects'),
      api.get('/v1/tasks?limit=1000'), // Fetch more tasks to get better stats
    ]);
    
    // Ensure we have valid data
    const projects = Array.isArray(projectsRes?.data) ? projectsRes.data : [];
    
    // Handle both paginated and non-paginated task responses
    let tasks = [];
    if (tasksRes?.data) {
      // Check if response is paginated (has data and pagination properties)
      tasks = Array.isArray(tasksRes.data.data) 
        ? tasksRes.data.data  // Paginated response
        : (Array.isArray(tasksRes.data) ? tasksRes.data : []); // Non-paginated response
    }
    
    console.log('Fetched tasks for dashboard:', tasks);

    // Safely calculate status summary with all possible statuses
    const statusCounts = tasks.reduce((acc: Record<string, number>, task: any) => {
      const status = task.status || 'UNKNOWN';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Ensure all statuses are included, even if count is 0
    const statusSummary = ['PENDING', 'IN_PROGRESS', 'COMPLETED'].map(status => ({
      status,
      value: statusCounts[status] || 0,
    }));

    const completedCount = statusCounts['COMPLETED'] || 0;
    const pendingCount = statusCounts['PENDING'] || 0;
    const totalTasks = tasks.length;

    return {
      totalProjects: projects.length,
      totalTasks,
      completedTasks: completedCount,
      pendingTasks: pendingCount,
      statusSummary,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    // Return default values in case of error
    return {
      totalProjects: 0,
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      statusSummary: [
        { status: 'PENDING', value: 0 },
        { status: 'IN_PROGRESS', value: 0 },
        { status: 'COMPLETED', value: 0 },
      ],
    };
  }
};

export interface ActivityItem {
  id: string;
  action: string;
  target: string;
  timestamp: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
}

export const fetchRecentActivities = async (): Promise<ActivityItem[]> => {
  try {
    // Fetch both projects and tasks to generate recent activities
    const [projectsRes, tasksRes] = await Promise.all([
      api.get('/v1/projects'),
      api.get('/v1/tasks'),
    ]);

    // Ensure we have valid data
    const projects = Array.isArray(projectsRes?.data) ? projectsRes.data : [];
    const tasks = Array.isArray(tasksRes?.data) ? tasksRes.data : [];

    // Generate activities from projects (e.g., project creation)
    const projectActivities: ActivityItem[] = projects
      .slice(0, 5)
      .filter((project: any) => project && project.id)
      .map((project: any) => ({
        id: `project-${project.id}`,
        action: 'created project',
        target: project.name || 'Untitled Project',
        timestamp: project.createdAt || new Date().toISOString(),
        user: {
          id: project.ownerId?.toString() || '1',
          username: project.owner?.username || project.ownerName || 'User',
          email: project.owner?.email || 'user@example.com',
        },
      }));

    // Generate activities from tasks (e.g., task updates)
    const taskActivities: ActivityItem[] = tasks
      .filter((task: any) => task && task.id) // Ensure task is valid
      .sort((a: any, b: any) => {
        const dateA = a.updatedAt || a.createdAt || 0;
        const dateB = b.updatedAt || b.createdAt || 0;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      })
      .slice(0, 5)
      .map((task: any) => ({
        id: `task-${task.id}`,
        action: `updated task to ${task.status || 'unknown status'}`,
        target: task.title || 'Untitled Task',
        timestamp: task.updatedAt || task.createdAt || new Date().toISOString(),
        user: {
          id: task.assigneeId?.toString() || task.creatorId?.toString() || '1',
          username: task.assignee?.username || task.creator?.username || 'User',
          email: task.assignee?.email || task.creator?.email || 'user@example.com',
        },
      }));

    // Combine and sort all activities by timestamp
    const allActivities = [...projectActivities, ...taskActivities]
      .filter(activity => activity) // Filter out any undefined/null activities
      .sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

    // Return the 5 most recent activities
    return allActivities.slice(0, 5);
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return [];
  }
};
