import { useQuery } from '@tanstack/react-query';
import { fetchDashboardStats, fetchRecentActivities } from '../api/dashboard';

import type { ActivityItem } from '../components/dashboard/RecentActivityFeed';

interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  statusSummary: { status: string; value: number }[];
}

export const useDashboardStats = () =>
  useQuery<DashboardStats, Error>(
    { queryKey: ['dashboardStats'], queryFn: fetchDashboardStats }
  );

export const useRecentActivities = () =>
  useQuery<ActivityItem[], Error>(
    { queryKey: ['recentActivities'], queryFn: fetchRecentActivities }
  );
