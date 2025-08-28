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
  type: string;
  action: string;
  target: string;
  targetId?: string;
  targetType?: 'task' | 'project' | 'user';
  status?: string;
  timestamp: string;
  user: {
    id: string;
    username: string;
    email: string;
    avatar?: string;
  };
  metadata?: {
    taskId?: string | number;
    taskTitle?: string;
    projectId?: string | number;
    projectName?: string;
    dueDate?: string;
    priority?: string;
    [key: string]: any;
  };
}

export const fetchRecentActivities = async (): Promise<ActivityItem[]> => {
  try {
    // Fetch projects, tasks, and users to generate recent activities
    const [projectsRes, tasksRes, usersRes] = await Promise.all([
      api.get('/v1/projects?limit=20&sort=-createdAt'),
      api.get('/v1/tasks?limit=20&sort=-updatedAt&include=assignee,creator,project'),
      api.get('/v1/users?limit=100'), // Get more users to reduce missing user info
    ]);

    // Process the responses with proper type safety
    const projects = Array.isArray(projectsRes?.data) ? projectsRes.data : [];
    
    // Handle both paginated and non-paginated task responses
    let tasks: any[] = [];
    if (tasksRes?.data) {
      tasks = Array.isArray(tasksRes.data.data) 
        ? tasksRes.data.data  // Paginated response
        : (Array.isArray(tasksRes.data) ? tasksRes.data : []); // Non-paginated response
    }
    
    const users = Array.isArray(usersRes?.data) ? usersRes.data : [];

    // Create a map of user IDs to user objects for quick lookup
    const userMap = users.reduce<Record<string, any>>((acc, user) => {
      if (user?.id) {
        acc[user.id] = {
          id: user.id.toString(),
          username: user.username || 'Unknown User',
          email: user.email || '',
          avatar: user.avatar
        };
      }
      return acc;
    }, {});

    // Default user for missing user data
    const defaultUser = {
      id: 'system',
      username: 'System',
      email: '',
      avatar: undefined
    };

    // Generate activities from projects
    const projectActivities: ActivityItem[] = projects
      .filter((project: any) => project?.id)
      .map((project: any) => ({
        id: `project-${project.id}`,
        type: 'PROJECT_CREATED',
        action: 'created project',
        target: project.name || 'Untitled Project',
        targetId: project.id.toString(),
        targetType: 'project' as const,
        timestamp: project.createdAt || new Date().toISOString(),
        user: project.ownerId ? {
          id: userMap[project.ownerId]?.id || 'system',
          username: userMap[project.ownerId]?.username || 'System',
          email: userMap[project.ownerId]?.email || '',
          avatar: userMap[project.ownerId]?.avatar
        } : defaultUser,
        metadata: {
          projectId: project.id,
          projectName: project.name,
          description: project.description
        }
      }));

    // Generate activities from tasks
    const taskActivities: ActivityItem[] = tasks
      .filter((task: any) => task?.id)
      .map((task: any) => {
        const assignee = task.assigneeId ? userMap[task.assigneeId] : null;
        const creator = task.creatorId ? userMap[task.creatorId] : null;
        const activityUser = assignee || creator || defaultUser;
        
        // Determine activity type based on task status and update time
        let activityType = 'TASK_UPDATED';
        if (task.status === 'COMPLETED') {
          activityType = 'TASK_COMPLETED';
        } else if (task.status === 'PENDING' && task.createdAt === task.updatedAt) {
          activityType = 'TASK_CREATED';
        }

        return {
          id: `task-${task.id}`,
          type: activityType,
          action: activityType.toLowerCase().replace('_', ' '),
          target: task.title || 'Untitled Task',
          targetId: task.id.toString(),
          targetType: 'task' as const,
          status: task.status,
          timestamp: task.updatedAt || task.createdAt || new Date().toISOString(),
          user: {
            id: activityUser.id,
            username: activityUser.username,
            email: activityUser.email,
            avatar: activityUser.avatar
          },
          metadata: {
            taskId: task.id,
            taskTitle: task.title,
            projectId: task.projectId,
            projectName: task.project?.name,
            dueDate: task.dueDate,
            priority: task.priority,
            status: task.status
          }
        };
      });

    // Combine and sort all activities by timestamp (newest first)
    const allActivities = [...projectActivities, ...taskActivities]
      .filter(Boolean) // Remove any null/undefined activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Return the 20 most recent activities
    return allActivities.slice(0, 20);
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return [];
  }
};
