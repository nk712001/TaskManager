import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Card, 
  Typography, 
  Spin, 
  Alert, 
  Button, 
  Space, 
  Descriptions, 
  Tag, 
  Divider, 
  Drawer, 
  message, 
  Row, 
  Col, 
  Tabs, 
  Avatar, 
  Progress, 
  Statistic, 
  Badge,
  Dropdown,
} from 'antd';
import { 
  ArrowLeftOutlined, 
  PlusOutlined, 
  EllipsisOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  BarChartOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import TaskForm from '../tasks/TaskForm';
import { fetchProjectById } from '../../api/projects';
import type { Project } from '../../api/projects';
import { fetchTasks } from '../../api/tasks';
import type { Task } from '../../api/tasks';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);


const { Title, Text } = Typography;

interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  progress: number;
}

const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  if (!id) {
    throw new Error('Project ID is required');
  }

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const { data: project, isLoading, isError, error } = useQuery<Project, Error>({
    queryKey: ['project', id],
    queryFn: () => fetchProjectById(id),
    enabled: !!id,
    retry: 1,
  });

  const { data: tasksResponse } = useQuery<{ data: Task[] }, Error>({
    queryKey: ['project-tasks', id],
    queryFn: async () => {
      console.log('Fetching tasks for project ID:', id);
      try {
        const result = await fetchTasks({ 
          projectId: id ? String(id) : undefined 
        });
        console.log('Fetched tasks:', result);
        return result;
      } catch (error) {
        console.error('Error fetching tasks:', error);
        throw error;
      }
    },
    enabled: !!id,
  });

  const tasks = tasksResponse?.data || [];
  console.log('Tasks to display:', tasks);

  const stats: ProjectStats = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'COMPLETED').length;
    const inProgressTasks = tasks.filter(task => task.status === 'IN_PROGRESS').length;
    const pendingTasks = tasks.filter(task => task.status === 'PENDING').length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      progress,
    };
  }, [tasks]);

  if (isError) {
    return (
      <Alert
        message="Error"
        description={error?.message || 'Failed to load project'}
        type="error"
        showIcon
      />
    );
  }

  if (!project) {
    return <Alert message="Project not found" type="warning" showIcon />;
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }


  const handleTaskSubmitSuccess = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['project', id] }),
      queryClient.invalidateQueries({ queryKey: ['project-tasks', id] })
    ]);
    setIsTaskDrawerOpen(false);
    message.success('Task created successfully');
  };

  const menuItems = [
    {
      key: 'edit',
      label: 'Edit Project',
      icon: <EditOutlined />,
    },
    {
      key: 'delete',
      label: 'Delete Project',
      icon: <DeleteOutlined />,
      danger: true,
    },
  ];

  const renderTaskCard = (task: Task, index: number) => {
    const hue = (index * 137.508) % 360;
    const bgColor = `hsla(${hue}, 60%, 98%, 0.8)`;
    const borderColor = `hsla(${hue}, 60%, 85%, 0.9)`;

    return (
      <Card 
        key={task.id}
        style={{
          marginBottom: '12px',
          backgroundColor: bgColor,
          borderColor: borderColor,
          transition: 'all 0.3s ease',
          cursor: 'pointer',
        }}
        bodyStyle={{ padding: '12px 16px' }}
        hoverable
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Link to={`/tasks/${task.id}`}>
              <Text strong style={{ marginRight: '8px', color: '#1890ff' }}>{task.title}</Text>
            </Link>
            <Tag 
              color={
                task.status === 'COMPLETED' ? 'success' : 
                task.status === 'IN_PROGRESS' ? 'processing' : 'default'
              }
            >
              {task.status?.replace('_', ' ')}
            </Tag>
          </div>
          {task.dueDate && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Due: {dayjs(task.dueDate).format('MMM D, YYYY')}
            </Text>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/projects')}
          style={{ marginBottom: '16px' }}
        >
          Back to Projects
        </Button>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <Title level={2} style={{ margin: 0 }}>{project?.name || 'Project Details'}</Title>
              {project?.createdAt && (
                <Text type="secondary">
                  Created {dayjs(project.createdAt).fromNow()}
                </Text>
              )}
            </div>
            <div>
              <Dropdown menu={{ items: menuItems }} trigger={['click']}>
                <Button type="text" icon={<EllipsisOutlined />} />
              </Dropdown>
            </div>
          </div>

          <div style={{ padding: '24px' }}>
            <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
              <Col xs={24} sm={12} md={6}>
                <Card size="small">
                  <Statistic 
                    title="Total Tasks" 
                    value={stats.totalTasks} 
                    prefix={<FileTextOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card size="small">
                  <Statistic 
                    title="In Progress" 
                    value={stats.inProgressTasks} 
                    prefix={<ClockCircleOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card size="small">
                  <Statistic 
                    title="Completed" 
                    value={stats.completedTasks} 
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card size="small">
                  <Statistic 
                    title="Progress" 
                    value={stats.progress} 
                    suffix="%"
                    prefix={<BarChartOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            <div style={{ marginBottom: '24px' }}>
              <Progress 
                percent={stats.progress} 
                status={stats.progress === 100 ? 'success' : 'active'}
                strokeColor={stats.progress === 100 ? '#52c41a' : '#1890ff'}
              />
            </div>

            <Tabs 
              activeKey={activeTab} 
              onChange={setActiveTab}
              items={[
                {
                  key: 'overview',
                  label: (
                    <span>
                      <FileTextOutlined />
                      <span>Overview</span>
                    </span>
                  ),
                },
                {
                  key: 'tasks',
                  label: (
                    <span>
                      <CheckCircleOutlined />
                      <span>Tasks</span>
                      {tasks.length > 0 && <Badge count={tasks.length} style={{ marginLeft: 8 }} />}
                    </span>
                  ),
                },
                {
                  key: 'team',
                  label: (
                    <span>
                      <TeamOutlined />
                      <span>Team</span>
                    </span>
                  ),
                },
              ]}
            />

            {activeTab === 'overview' && (
              <div style={{ marginTop: '24px' }}>
                <Title level={4}>Project Details</Title>
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label="Project Name">{project?.name}</Descriptions.Item>
                  <Descriptions.Item label="Description">
                    {project?.description || 'No description provided'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Created">
                    {project?.createdAt && (
                      <span>
                        {new Date(project.createdAt).toLocaleDateString()} 
                        <Text type="secondary" style={{ marginLeft: '8px' }}>
                          ({dayjs(project.createdAt).fromNow()})
                        </Text>
                      </span>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Owner">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Avatar size="small" icon={<UserOutlined />} />
                      <span>
                        {project?.owner?.name || project?.owner?.email || project?.ownerName || 'Unassigned'}
                      </span>
                    </div>
                  </Descriptions.Item>
                </Descriptions>
              </div>
            )}

            {activeTab === 'team' && (
              <div style={{ marginTop: '24px' }}>
                <Title level={4}>Project Team</Title>
                <Card>
                  <div style={{ marginBottom: 16 }}>
                    <Text strong>Owner</Text>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                      <Avatar size={40} icon={<UserOutlined />} />
                      <span>
                        {project?.owner?.name || project?.owner?.email || project?.ownerName || 'Unassigned'}
                        <span style={{ color: '#8c8c8c', marginLeft: 8 }}>(Owner)</span>
                      </span>
                    </div>
                  </div>
                  <Divider style={{ margin: '16px 0' }} />
                  <Text strong>Assignees</Text>
                  <div style={{ marginTop: 8 }}>
                    {(() => {
                      // Collect unique assignees from tasks
                      const assigneesMap = new Map();
                      tasks.forEach(task => {
                        if (task.assignee && task.assignee.id) {
                          assigneesMap.set(task.assignee.id, task.assignee);
                        }
                      });
                      // Remove owner if also in assignees
                      if (project?.owner?.id) {
                        assigneesMap.delete(project.owner.id);
                      }
                      const assignees = Array.from(assigneesMap.values());
                      if (assignees.length === 0) {
                        return <div style={{ color: '#8c8c8c' }}>No assignees for this project yet.</div>;
                      }
                      return (
                        <Space direction="vertical" size={16} style={{ width: '100%' }}>
                          {assignees.map(user => (
                            <div key={user.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <Avatar size={36} icon={<UserOutlined />} />
                              <span>{user.name || user.email}</span>
                            </div>
                          ))}
                        </Space>
                      );
                    })()}
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'tasks' && (
              <div style={{ marginTop: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
  <Title level={4} style={{ margin: 0 }}>Tasks</Title>
  {tasks.length > 0 && (
    <Button 
      type="primary" 
      icon={<PlusOutlined />} 
      onClick={() => setIsTaskDrawerOpen(true)}
    >
      Add Task
    </Button>
  )}
</div>
                
                {tasks.length === 0 ? (
                  <Card>
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                      <FileTextOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
                      <div style={{ fontSize: '16px', color: '#8c8c8c', marginBottom: '16px' }}>
                        No tasks found for this project
                      </div>
                      <Button 
                        type="primary" 
                        onClick={() => setIsTaskDrawerOpen(true)}
                        style={{ marginTop: '16px' }}
                      >
                        Create your first task
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <div>
                    {tasks.map((task, index) => renderTaskCard(task, index))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
        
        <Drawer
          title="Create New Task"
          width={720}
          onClose={() => setIsTaskDrawerOpen(false)}
          open={isTaskDrawerOpen}
          destroyOnClose
          styles={{
            body: {
              paddingBottom: 80,
            },
          }}
        >
          <TaskForm 
            onCancel={() => setIsTaskDrawerOpen(false)}
            projectId={project?.id}
            onSuccess={handleTaskSubmitSuccess}
          />
        </Drawer>
      </div>
    </div>
  );
};

export default ProjectDetails;
