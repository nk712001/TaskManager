import { useQuery } from '@tanstack/react-query';
import { fetchDashboardStats, fetchRecentActivities } from '../api/dashboard';
import type { ActivityItem as APIActivityItem } from '../api/dashboard';

interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  statusSummary: { status: string; value: number }[];
}

interface UseRecentActivitiesReturn {
  data: APIActivityItem[];
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
const transformActivities = (activities: APIActivityItem[] = []): APIActivityItem[] => {
  return activities.map(activity => ({
    ...activity,
    // Ensure all required fields are present with proper fallbacks
    id: activity.id || `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: activity.timestamp || new Date().toISOString(),
    user: {
      id: activity.user?.id?.toString() || 'system',
      username: activity.user?.username || 'System',
      email: activity.user?.email || '',
      avatar: activity.user?.avatar
    },
    // Ensure metadata exists and has proper structure
    metadata: {
      ...(activity.metadata || {}),
      // Add any additional metadata processing here if needed
    }
  }));
};

export const useRecentActivities = (): UseRecentActivitiesReturn => {
  const queryInfo = useQuery<APIActivityItem[], Error, APIActivityItem[]>({
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
    // Cache for 1 minute
    staleTime: 60000,
  });

  return {
    data: queryInfo.data || [],
    isLoading: queryInfo.isLoading,
    isRefreshing: queryInfo.isFetching && !queryInfo.isLoading,
    error: queryInfo.error || null,
    isError: queryInfo.isError,
  };
};
