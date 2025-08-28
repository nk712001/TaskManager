import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button, Card, Descriptions, Space, Tag, Typography, message, Skeleton, Badge,
  Dropdown, Menu, Modal, Empty, Drawer
} from 'antd';
import {
  ArrowLeftOutlined, EditOutlined, DeleteOutlined,
  CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined,
  MoreOutlined, UserAddOutlined
} from '@ant-design/icons';
import TaskForm from './TaskForm';
import { fetchTaskById, updateTaskStatus, assignTask, deleteTask } from '../../api/tasks';
import type { Task } from '../../api/tasks';
import { fetchUsers } from '../../api/users';
import type { User } from '../../api/users';
import { fetchProjectById } from '../../api/projects';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../utils/dateUtils';

const { Title, Text, Paragraph } = Typography;

const statusOptions = [
  { value: 'PENDING', label: 'Pending', icon: <ClockCircleOutlined />, color: 'orange' },
  { value: 'IN_PROGRESS', label: 'In Progress', icon: <ClockCircleOutlined />, color: 'blue' },
  { value: 'COMPLETED', label: 'Completed', icon: <CheckCircleOutlined />, color: 'green' },
  { value: 'CANCELLED', label: 'Cancelled', icon: <CloseCircleOutlined />, color: 'red' },
];

const priorityColors = {
  LOW: 'green',
  MEDIUM: 'orange',
  HIGH: 'red',
} as const;

const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);

  const { data: task, isLoading, error } = useQuery({
    queryKey: ['task', id],
    queryFn: () => fetchTaskById(id!), // Non-null assertion as we know id is defined when enabled
    enabled: !!id,
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  // Find creator from users list
  const creator = task?.creatorId 
    ? users.find(user => String(user.id) === String(task.creatorId))
    : null;

  // Fetch project details
  const { data: project } = useQuery({
    queryKey: ['project', task?.projectId],
    queryFn: () => task?.projectId ? fetchProjectById(String(task.projectId)) : null,
    enabled: !!task?.projectId,
  });

  const statusUpdateMutation = useMutation<unknown, Error, Task['status']>({
    mutationFn: (status: Task['status']) =>
      updateTaskStatus(id!, status), // Non-null assertion as we know id is defined
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', id] });
      message.success('Task status updated');
    },
    onError: () => {
      message.error('Failed to update task status');
    }
  });

  const assignTaskMutation = useMutation<unknown, Error, string>({
    mutationFn: (userId: string) =>
      assignTask(id!, userId), // Non-null assertion as we know id is defined
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', id] });
      message.success('Task assigned successfully');
    },
    onError: () => {
      message.error('Failed to assign task');
    }
  });

  const deleteTaskMutation = useMutation<unknown, Error, void>({
    mutationFn: () => deleteTask(id!), // Non-null assertion as we know id is defined
    onSuccess: () => {
      message.success('Task deleted successfully');
      navigate('/tasks');
    },
    onError: () => {
      message.error('Failed to delete task');
    }
  });

  const handleStatusChange = (status: Task['status']) => {
    statusUpdateMutation.mutate(status);
  };

  const handleAssignUser = (userId: string) => {
    assignTaskMutation.mutate(userId);
  };

  // Helper function to get status update button props
  const getStatusButtonProps = (status: Task['status']) => ({
    loading: statusUpdateMutation.isPending && statusUpdateMutation.variables === status,
    disabled: task?.status === status || statusUpdateMutation.isPending,
    onClick: () => handleStatusUpdate(status),
  });

  const handleDeleteTask = () => {
    deleteTaskMutation.mutate();
  };

  // Helper function to get user display name
  const getUserDisplayName = (user?: any) => {
    if (!user) return 'Unassigned';

    // Handle string usernames directly
    if (typeof user === 'string') {
      return user.includes('@') ? user.split('@')[0] : user;
    }

    // Handle user object with username
    if (user.username) {
      return user.username.includes('@') ? user.username.split('@')[0] : user.username;
    }

    // Handle user object with email
    if (user.email) {
      return user.email.split('@')[0];
    }

    // Handle direct email as username
    if (typeof user === 'string' && user.includes('@')) {
      return user.split('@')[0];
    }
    return 'Unknown';
  };

  if (isLoading) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    );
  }

  if (error || !task) {
    return (
      <Empty
        description={
          <span>
            {error ? 'Error loading task details' : 'Task not found'}
          </span>
        }
      >
        <Button type="primary" onClick={() => navigate('/tasks')}>
          Back to Tasks
        </Button>
      </Empty>
    );
  }

  const currentStatus = statusOptions.find(s => s.value === task.status);
  const priorityColor = priorityColors[task.priority as keyof typeof priorityColors] || 'default';

  const handleEditSuccess = () => {
    setIsEditDrawerOpen(false);
    queryClient.invalidateQueries({ queryKey: ['task', id] });
    message.success('Task updated successfully');
  };

  const menu = (
    <Menu>
      <Menu.Item
        key="edit"
        icon={<EditOutlined />}
        onClick={() => setIsEditDrawerOpen(true)}
      >
        Edit Task
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key="delete"
        danger
        icon={<DeleteOutlined />}
        onClick={handleDeleteTask}
      >
        Delete Task
      </Menu.Item>
    </Menu>
  );

  return (
    <div className="task-detail">
      <div style={{ marginBottom: 16 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
        >
          Back to Tasks
        </Button>
      </div>

      <Card
        title={
          <Space>
            <Title level={4} style={{ margin: 0 }}>{task.title}</Title>
            <Tag
              color={currentStatus?.color}
              icon={currentStatus?.icon}
              style={{ textTransform: 'capitalize' }}
            >
              {task.status.replace('_', ' ')}
            </Tag>
            <Tag color={priorityColor} style={{ textTransform: 'capitalize' }}>
              {task.priority}
            </Tag>
          </Space>
        }
        extra={
          <Space>
            <Dropdown overlay={menu} trigger={['click']}>
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        }
      >
        <Descriptions bordered column={1} size="small">
          {project && (
            <Descriptions.Item label="Project">
              <Link to={`/projects/${project.id}`}>
                {project.name}
              </Link>
            </Descriptions.Item>
          )}
          <Descriptions.Item label="Description">
            <Paragraph style={{ margin: 0 }}>
              {task.description || 'No description provided'}
            </Paragraph>
          </Descriptions.Item>

          <Descriptions.Item label="Due Date">
            {task.dueDate ? formatDate(task.dueDate) : 'No due date'}
          </Descriptions.Item>

          <Descriptions.Item label="Assignee">
            <Space>
              {task.assignee ? (
                <Space>
                  <Badge status="success" />
                  <span>{getUserDisplayName(task.assignee)}</span>
                </Space>
              ) : (
                <Dropdown
                  overlay={
                    <Menu>
                      {users.map(user => (
                        <Menu.Item
                          key={user.id}
                          onClick={() => handleAssignUser(String(user.id))}
                          disabled={assignTaskMutation.isPending}
                        >
                          {getUserDisplayName(user)}
                        </Menu.Item>
                      ))}
                    </Menu>
                  }
                  trigger={['click']}
                >
                  <Button
                    type="dashed"
                    icon={<UserAddOutlined />}
                    loading={assignTaskMutation.isPending}
                  >
                    Assign to...
                  </Button>
                </Dropdown>
              )}
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label="Status">
            <Space wrap>
              {statusOptions.map(status => (
                <Button
                  key={status.value}
                  type={task.status === status.value ? 'primary' : 'default'}
                  icon={status.icon}
                  onClick={() => handleStatusChange(status.value as Task['status'])}
                  loading={statusUpdateMutation.isPending && status.value === task.status}
                  disabled={statusUpdateMutation.isPending}
                >
                  {status.label}
                </Button>
              ))}
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label="Created By">
            <Space>
              <Badge status="processing" />
              <span>{creator ? getUserDisplayName(creator) : 'Unknown'}</span>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Created At">
            {formatDate(task.createdAt)}
          </Descriptions.Item>

          <Descriptions.Item label="Last Updated">
            {formatDate(task.updatedAt)}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Drawer
        title="Edit Task"
        width={720}
        open={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
        destroyOnClose
        styles={{
          body: {
            paddingBottom: 80,
          },
        }}
      >
        {task && (
          <TaskForm
            task={task}
            onSuccess={handleEditSuccess}
            onCancel={() => setIsEditDrawerOpen(false)}
          />
        )}
      </Drawer>
    </div>
  );
};

export default TaskDetail;
