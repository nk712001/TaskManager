import React from 'react';
import { List, Avatar, Spin, Typography, Space } from 'antd';
import { SyncOutlined } from '@ant-design/icons';

export interface ActivityUser {
  id: string;
  username: string;
  email: string;
}

export interface ActivityItem {
  id: string;
  user: ActivityUser;
  action: string;
  target: string;
  time: string;
  timestamp?: string; // ISO date string for sorting
}

interface RecentActivityFeedProps {
  activities: ActivityItem[];
  isLoading?: boolean;
  isRefreshing?: boolean;
}

// Helper function to format time ago
const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  let interval = Math.floor(seconds / 31536000);
  if (interval > 1) return `${interval} years ago`;
  if (interval === 1) return '1 year ago';
  
  interval = Math.floor(seconds / 2592000);
  if (interval > 1) return `${interval} months ago`;
  if (interval === 1) return '1 month ago';
  
  interval = Math.floor(seconds / 86400);
  if (interval > 1) return `${interval} days ago`;
  if (interval === 1) return '1 day ago';
  
  interval = Math.floor(seconds / 3600);
  if (interval > 1) return `${interval} hours ago`;
  if (interval === 1) return '1 hour ago';
  
  interval = Math.floor(seconds / 60);
  if (interval > 1) return `${interval} minutes ago`;
  
  return 'Just now';
};

const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({ 
  activities = [], 
  isLoading = false,
  isRefreshing = false
}) => {
  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '24px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 8 }}>Loading activities...</div>
      </div>
    );
  }

  // Sort activities by timestamp (newest first)
  const sortedActivities = [...activities].sort((a, b) => {
    const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return timeB - timeA;
  });

  // Format activities with display time
  const formattedActivities = sortedActivities.map(activity => ({
    ...activity,
    displayTime: activity.timestamp 
      ? formatTimeAgo(activity.timestamp) 
      : activity.time || 'Some time ago'
  }));

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 16 
      }}>
        <Typography.Title level={5} style={{ margin: 0 }}>Recent Activity</Typography.Title>
        {isRefreshing && (
          <Space>
            <SyncOutlined spin style={{ color: '#1890ff' }} />
            <Typography.Text type="secondary">Updating...</Typography.Text>
          </Space>
        )}
      </div>
      
      <List
        itemLayout="horizontal"
        dataSource={formattedActivities}
        locale={{ emptyText: 'No recent activities' }}
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta
              avatar={
                <Avatar 
                  style={{ 
                    backgroundColor: '#1890ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {item.user?.username?.[0]?.toUpperCase() || '?'}
                </Avatar>
              }
              title={
                <span>
                  <strong>{item.user?.username || 'Unknown User'}</strong>{' '}
                  <span style={{ color: '#666' }}>{item.action}</span>{' '}
                  <strong>{item.target}</strong>
                </span>
              }
              description={
                <Space>
                  <span style={{ color: '#8c8c8c' }}>{item.displayTime}</span>
                  {item.timestamp && (
                    <span style={{ fontSize: '0.8em', color: '#bfbfbf' }}>
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  )}
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );
};

export default RecentActivityFeed;
