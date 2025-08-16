import api from './axios';

export const fetchDashboardStats = async () => {
  // Option 1: If backend provides a dashboard stats endpoint, use it:
  // const { data } = await api.get('/v1/dashboard/stats');
  // return data;

  // Option 2: Otherwise, fetch projects and tasks and aggregate on frontend
  const [projectsRes, tasksRes] = await Promise.all([
    api.get('/v1/projects'),
    api.get('/v1/tasks'),
  ]);
  const projects = projectsRes.data;
  const tasks = tasksRes.data;

  const statusSummary = ['Pending', 'In Progress', 'Completed'].map(status => ({
    status,
    value: tasks.filter((t: any) => t.status === status).length,
  }));

  return {
    totalProjects: projects.length,
    totalTasks: tasks.length,
    completedTasks: tasks.filter((t: any) => t.status === 'Completed').length,
    pendingTasks: tasks.filter((t: any) => t.status === 'Pending').length,
    statusSummary,
  };
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

    const projects = projectsRes.data || [];
    const tasks = tasksRes.data || [];

    // Generate activities from projects (e.g., project creation)
    const projectActivities: ActivityItem[] = projects.slice(0, 5).map((project: any) => ({
      id: `project-${project.id}`,
      action: 'created project',
      target: project.name,
      timestamp: project.createdAt || new Date().toISOString(),
      user: {
        id: project.ownerId?.toString() || '1',
        username: project.ownerName,
        email: project.owner?.email || 'user@example.com',
      },
    }));

    // Generate activities from tasks (e.g., task updates)
    const taskActivities: ActivityItem[] = tasks
      .sort((a: any, b: any) => 
        new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
      )
      .slice(0, 5)
      .map((task: any) => ({
        id: `task-${task.id}`,
        action: `updated task to ${task.status}`,
        target: task.title,
        timestamp: task.updatedAt || task.createdAt || new Date().toISOString(),
        user: {
          id: task.assigneeId?.toString() || task.creatorId?.toString() || '1',
          username: task.assignee?.username || task.creator?.username || 'User',
          email: task.assignee?.email || task.creator?.email || 'user@example.com',
        },
      }));

    // Combine and sort all activities by timestamp
    const allActivities = [...projectActivities, ...taskActivities].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Return the 5 most recent activities
    return allActivities.slice(0, 5);
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return [];
  }
};
