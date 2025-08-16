import React from 'react';
import { Typography, Card, Spin, Alert, Row, Col } from 'antd';
import { useDashboardStats, useRecentActivities } from '../../hooks/useDashboard';
import OverviewCards from '../../components/dashboard/OverviewCards';
import StatusSummaryChart from '../../components/dashboard/StatusSummaryChart';
import RecentActivityFeed from '../../components/dashboard/RecentActivityFeed';
import type { ActivityItem } from '../../components/dashboard/RecentActivityFeed';

const { Title } = Typography;

const Dashboard: React.FC = () => {
  const { data: stats, isLoading: isLoadingStats, error: statsError } = useDashboardStats();
  const { 
    data: activities = [], 
    isLoading: isLoadingActivities, 
    error: activitiesError,
    isRefreshing: isRefreshingActivities 
  } = useRecentActivities();

  // Prepare data for OverviewCards
  const overviewData = stats ? [
    { title: 'Total Projects', value: stats.totalProjects, color: '#1890ff' },
    { title: 'Total Tasks', value: stats.totalTasks, color: '#52c41a' },
    { title: 'Completed Tasks', value: stats.completedTasks, color: '#722ed1' },
    { title: 'Pending Tasks', value: stats.pendingTasks, color: '#faad14' },
  ] : [];

  if (isLoadingStats || isLoadingActivities) {
    return (
      <div style={{ textAlign: 'center', padding: '24px' }}>
        <Spin size="large" />
        <div>Loading dashboard...</div>
      </div>
    );
  }

  if (statsError || activitiesError) {
    const errorMessage = statsError?.message || activitiesError?.message || 'An error occurred';
    return (
      <Alert
        message="Error loading dashboard"
        description={errorMessage}
        type="error"
        showIcon
        style={{ margin: '24px' }}
      />
    );
  }

  // Ensure activities is always an array
  const safeActivities: ActivityItem[] = Array.isArray(activities) 
    ? activities 
    : [];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2} style={{ marginBottom: '24px' }}>Dashboard</Title>
      
      {/* Overview Cards */}
      <div style={{ marginBottom: '24px' }}>
        <OverviewCards data={overviewData} />
      </div>

      {/* Main Content */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card title="Task Status Summary" style={{ marginBottom: '24px' }}>
            <StatusSummaryChart data={stats?.statusSummary || []} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Recent Activity">
            <RecentActivityFeed 
              activities={safeActivities} 
              isLoading={isLoadingActivities}
              isRefreshing={isRefreshingActivities}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
