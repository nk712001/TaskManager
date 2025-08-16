import { useQuery } from '@tanstack/react-query';
import { fetchDashboardStats, fetchRecentActivities } from '../api/dashboard';
import type { ActivityItem as APIActivityItem } from '../api/dashboard';
import type { ActivityItem } from '../components/dashboard/RecentActivityFeed';

interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  statusSummary: { status: string; value: number }[];
}

interface UseRecentActivitiesReturn {
  data: ActivityItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: Error | null;
  isError: boolean;
}

export const useDashboardStats = () =>
  useQuery<DashboardStats, Error>(
    { queryKey: ['dashboardStats'], queryFn: fetchDashboardStats }
  );

// Transform API response to match the component's expected format
const transformActivities = (activities: APIActivityItem[] = []): ActivityItem[] => {
  return activities.map(activity => ({
    ...activity,
    time: activity.timestamp 
      ? new Date(activity.timestamp).toLocaleString() 
      : 'Some time ago',
    user: {
      id: activity.user?.id?.toString() || 'unknown',
      username: activity.user?.username || 'Unknown User',
      email: activity.user?.email || ''
    }
  }));
};

export const useRecentActivities = (): UseRecentActivitiesReturn => {
  const queryInfo = useQuery<APIActivityItem[], Error, ActivityItem[]>({
    queryKey: ['recentActivities'],
    queryFn: fetchRecentActivities,
    select: transformActivities,
    // Refetch every 30 seconds
    refetchInterval: 30000,
    // Keep previous data while fetching new data
    placeholderData: (previousData) => previousData || [],
    // Retry failed requests
    retry: 3,
    retryDelay: 1000,
    // Don't show loading state when background refetching
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  return {
    data: queryInfo.data || [],
    isLoading: queryInfo.isLoading,
    isRefreshing: queryInfo.isFetching && !queryInfo.isLoading,
    error: queryInfo.error || null,
    isError: queryInfo.isError,
  };
};
