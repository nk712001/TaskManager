import React from 'react';
import { List, Avatar, Spin, Card, Tag, Tooltip } from 'antd';
import { 
  SyncOutlined, 
  ProjectOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  UserOutlined,
  CheckOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';

export interface ActivityUser {
  id: string;
  username: string;
  email: string;
  avatar?: string;
}

export interface ActivityItem {
  id: string;
  type: string;
  action: string;
  target: string;
  targetId?: string;
  targetType?: 'task' | 'project' | 'user';
  status?: string;
  timestamp: string;
  user: ActivityUser;
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

interface RecentActivityFeedProps {
  activities: ActivityItem[];
  isLoading?: boolean;
  isRefreshing?: boolean;
}

// Format time to a readable format
const formatActivityTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'TASK_CREATED':
      return <ClockCircleOutlined style={{ color: '#1890ff' }} />;
    case 'TASK_UPDATED':
      return <ClockCircleOutlined style={{ color: '#1890ff' }} />;
    case 'TASK_COMPLETED':
      return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    case 'PROJECT_CREATED':
      return <ProjectOutlined style={{ color: '#722ed1' }} />;
    case 'USER_JOINED':
      return <UserOutlined style={{ color: '#faad14' }} />;
    default:
      return <ClockCircleOutlined style={{ color: '#8c8c8c' }} />;
  }
};

const getStatusTag = (status?: string) => {
  if (!status) return null;
  
  const statusConfig: Record<string, { color: string; text: string }> = {
    'COMPLETED': { color: 'success', text: 'Done' },
    'IN_PROGRESS': { color: 'processing', text: 'In Progress' },
    'PENDING': { color: 'default', text: 'Pending' },
    'TODO': { color: 'default', text: 'To Do' },
    'IN_REVIEW': { color: 'warning', text: 'Review' },
    'BLOCKED': { color: 'error', text: 'Blocked' },
    'DONE': { color: 'success', text: 'Done' },
    'OPEN': { color: 'blue', text: 'Open' },
    'CLOSED': { color: 'default', text: 'Closed' },
  };

  const config = statusConfig[status.toUpperCase()] || { 
    color: 'default', 
    text: status.replace(/_/g, ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  };
  
  return (
    <Tooltip title={status.replace(/_/g, ' ')}>
      <Tag 
        color={config.color}
        icon={status.toUpperCase() === 'COMPLETED' || status.toUpperCase() === 'DONE' ? <CheckOutlined /> : undefined}
        style={{ 
          margin: 0,
          textTransform: 'capitalize',
          fontWeight: 500,
          borderRadius: 12,
          padding: '0 8px',
          fontSize: '12px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '100%',
          display: 'inline-flex',
          alignItems: 'center',
          height: '22px'
        }}
      >
        <span style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: '80px',
          display: 'inline-block'
        }}>
          {config.text}
        </span>
      </Tag>
    </Tooltip>
  );
};

// Helper function to get color based on priority
const getPriorityColor = (priority?: string) => {
  if (!priority) return 'default';
  
  const priorityMap: Record<string, string> = {
    'HIGH': 'red',
    'MEDIUM': 'orange',
    'LOW': 'blue',
    'URGENT': 'red',
    'NORMAL': 'blue',
    'DEFAULT': 'default',
  };
  
  return priorityMap[priority.toUpperCase()] || 'default';
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
  const sortedActivities = [...activities].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // View More functionality
  const [showAll, setShowAll] = React.useState(false);
  const visibleActivities = showAll ? sortedActivities : sortedActivities.slice(0, 3);
  const getActivityContent = (item: ActivityItem) => {
    const isTask = item.targetType === 'task' || item.id?.startsWith('task-');
    const isProject = item.targetType === 'project' || item.id?.startsWith('project-');
    
    // Truncate long text
    const truncate = (text: string, maxLength: number = 60) => {
      if (!text) return '';
      return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
    };
    
    // Format the activity message based on the type
    const getActivityMessage = () => {
      const userName = item.user?.username || 'Someone';
      const target = item.target || 'an item';
      
      switch (item.type) {
        case 'TASK_CREATED':
          return `${userName} created a new task: ${target}`;
        case 'TASK_UPDATED':
          return `${userName} updated task: ${target}`;
        case 'TASK_COMPLETED':
          return `${userName} completed task: ${target}`;
        case 'PROJECT_CREATED':
          return `${userName} created a new project: ${target}`;
        default:
          return `${userName} performed an action on ${target}`;
      }
    };
    
    // Format the timestamp
    const formatTimestamp = (timestamp: string) => {
      try {
        const date = new Date(timestamp);
        return date.toLocaleString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (e) {
        return 'Just now';
      }
    };
    
    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ marginRight: 12 }}>
          {getActivityIcon(item.type)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ marginRight: 4 }}>
              <strong>{item.user.username}</strong>
            </span>
            <span style={{ color: '#595959', margin: '0 4px' }}>
              {item.action}
            </span>
            {isTask ? (
              <Link to={`/tasks/${item.targetId || item.id.replace('task-', '')}`}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                      {item.user?.avatar ? (
                        <Avatar 
                          src={item.user.avatar} 
                          size="small" 
                          style={{ marginRight: 8 }}
                          alt={item.user.username}
                        />
                      ) : (
                        <Avatar 
                          size="small" 
                          style={{ 
                            backgroundColor: '#1890ff',
                            marginRight: 8 
                          }}
                        >
                          {item.user?.username?.charAt(0)?.toUpperCase() || 'U'}
                        </Avatar>
                      )}
                      <div>
                        <div style={{ fontWeight: 500 }}>{getActivityMessage()}</div>
                        <div style={{ color: '#8c8c8c', fontSize: '12px' }}>
                          {formatTimestamp(item.timestamp)}
                        </div>
                      </div>
                    </div>
                    
                    {item.metadata?.projectName && (
                      <div style={{ marginTop: 4, fontSize: '13px' }}>
                        <span style={{ color: '#8c8c8c' }}>Project: </span>
                        <Link to={`/projects/${item.metadata.projectId}`}>
                          {item.metadata.projectName}
                        </Link>
                      </div>
                    )}
                    
                    {(item.metadata?.dueDate || item.metadata?.priority) && (
                      <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: '12px' }}>
                        {item.metadata.dueDate && (
                          <span>
                            <ClockCircleOutlined style={{ marginRight: 4 }} />
                            {new Date(item.metadata.dueDate).toLocaleDateString()}
                          </span>
                        )}
                        {item.metadata.priority && (
                          <span>
                            <Tag color={getPriorityColor(item.metadata.priority)}>
                              {item.metadata.priority}
                            </Tag>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {item.status && (
                    <div style={{ marginLeft: 'auto' }}>
                      {getStatusTag(item.status)}
                    </div>
                  )}
                </div>
              </Link>
            ) : isProject ? (
              <Link to={`/projects/${item.targetId || item.id.replace('project-', '')}`}>
                <strong style={{ color: '#722ed1', margin: '0 4px' }}>
                  {item.target}
                </strong>
              </Link>
            ) : (
              <strong style={{ margin: '0 4px' }}>{item.target}</strong>
            )}
            {item.status && getStatusTag(item.status)}
          </div>
          <div style={{ color: '#8c8c8c', fontSize: '12px', marginTop: 4 }}>
            {formatActivityTime(item.timestamp)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: '16px 12px',
      background: 'var(--bg-color)',
      boxShadow: 'none',
      border: 'none',
      minHeight: 0,
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 0 16px 0',
        fontWeight: 600,
        fontSize: 18,
        letterSpacing: '-0.5px',
      }}>
        <span style={{letterSpacing: '-0.5px'}}>Recent Activity</span>
        {isRefreshing && <SyncOutlined spin />}
      </div>
      <Card
        style={{
          width: '100%',
          maxWidth: '1200px',
          borderRadius: 10,
          boxShadow: '0 1px 4px 0 rgba(0,0,0,0.03)',
          border: '1px solid var(--border-color, #e5e6e8)',
          background: 'var(--bg-color)',
          padding: '10px 6px 18px',
          minHeight: 180,
          marginBottom: 8,
        }}
        bodyStyle={{ padding: '4px 0 4px 0' }}
      >
        <List<ActivityItem>
          className="activity-feed"
          itemLayout="horizontal"
          dataSource={visibleActivities}
          loading={false}
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            width: '100%',
            maxWidth: '100%',
          }}
          renderItem={(item: ActivityItem) => (
            <List.Item
              style={{
                padding: '18px 0',
                borderBottom: '1px solid #f0f0f0',
                margin: 0,
                alignItems: 'center',
                width: '100%',
                maxWidth: '100%',
              }}
            >
              <List.Item.Meta
                avatar={
                  <Tooltip title={item.user.email}>
                    <Avatar
                      src={item.user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${item.user.username}`}
                      alt={item.user.username}
                      style={{
                        backgroundColor: '#1890ff',
                        minWidth: '40px',
                        width: 40,
                        height: 40,
                        fontSize: 20,
                        border: '2px solid #f0f0f0',
                      }}
                    >
                      {item.user.username.charAt(0).toUpperCase()}
                    </Avatar>
                  </Tooltip>
                }
                description={
                  <div
                    style={{
                      maxWidth: '95%',
                      width: '95%',
                      wordBreak: 'break-word',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: 15,
                      fontWeight: 500,
                      color: 'var(--text-color)',
                    }}
                  >
                    {getActivityContent(item)}
                  </div>
                }
              />
            </List.Item>
          )}
          locale={{
            emptyText: <span style={{ color: 'var(--text-secondary, #bfbfbf)', fontSize: 16 }}>No recent activities</span>
          }}
        />
        {/* View More/Less Button */}
        {sortedActivities.length > 3 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10, marginBottom: 6 }}>
            <button
              onClick={() => setShowAll((prev) => !prev)}
              style={{
                border: '1px solid var(--border-color, #e5e6e8)',
                background: 'var(--button-bg, var(--bg-color))',
                color: 'var(--text-color)',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: 14,
                padding: '6px 22px',
                borderRadius: 8,
                outline: 'none',
                boxShadow: 'none',
                transition: 'background 0.2s, color 0.2s',
                letterSpacing: '0.2px',
              }}
            >
              {showAll ? 'View Less' : 'View More'}
            </button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default RecentActivityFeed;
