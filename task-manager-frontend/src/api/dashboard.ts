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

export const fetchRecentActivities = async () => {
  // Option 1: If backend provides an activity endpoint, use it:
  // const { data } = await api.get('/v1/activity/recent');
  // return data;

  // Option 2: Otherwise, mock or return empty for now
  return [];
};
