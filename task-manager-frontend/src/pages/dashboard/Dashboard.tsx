import { Typography } from 'antd';

const { Title } = Typography;

import OverviewCards from '../../components/dashboard/OverviewCards';
import StatusSummaryChart from '../../components/dashboard/StatusSummaryChart';
import RecentActivityFeed from '../../components/dashboard/RecentActivityFeed';
import { useDashboardStats, useRecentActivities } from '../../hooks/useDashboard';
import { Spin, Alert } from 'antd';


const Dashboard = () => {
  const { data: stats, isLoading: statsLoading, isError: statsError } = useDashboardStats();
  const { data: activities, isLoading: activitiesLoading, isError: activitiesError } = useRecentActivities();

  const overviewData = stats
    ? [
        { title: 'Total Projects', value: stats.totalProjects, color: '#1890ff' },
        { title: 'Total Tasks', value: stats.totalTasks, color: '#52c41a' },
        { title: 'Completed Tasks', value: stats.completedTasks, color: '#13c2c2' },
        { title: 'Pending Tasks', value: stats.pendingTasks, color: '#faad14' },
      ]
    : [];

  return (
    <div style={{ maxWidth: '100vw', overflowX: 'hidden', overflowY: 'auto', minHeight: '100vh', padding: 8 }}>

      <Title level={2}>Dashboard Overview</Title>
      {statsLoading ? (
        <Spin />
      ) : statsError ? (
        <Alert type="error" message="Failed to load dashboard stats." />
      ) : (
        <OverviewCards data={overviewData} />
      )}

      <div style={{ marginTop: 32, marginBottom: 32 }}>
        <Title level={4}>Task Status Summary</Title>
        {statsLoading ? (
          <Spin />
        ) : statsError ? (
          <Alert type="error" message="Failed to load task status summary." />
        ) : (
          <StatusSummaryChart data={stats?.statusSummary || []} />
        )}
      </div>

      <div style={{ marginTop: 32 }}>
        <Title level={4}>Recent Activity</Title>
        {activitiesLoading ? (
          <Spin />
        ) : activitiesError ? (
          <Alert type="error" message="Failed to load recent activity." />
        ) : (
          <RecentActivityFeed activities={activities || []} />
        )}
      </div>
    </div>
  );
};

export default Dashboard;

