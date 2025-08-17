import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Typography, Spin, Alert, Button, Space, Descriptions, Tag, Divider } from 'antd';
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
import { fetchProjectById } from '../../api/projects';
import type { Project } from '../../api/projects';

const { Title, Text } = Typography;

const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: project, isLoading, isError, error } = useQuery<Project, Error>({
    queryKey: ['project', id],
    queryFn: () => {
      if (!id) throw new Error('Project ID is required');
      return fetchProjectById(id);
    },
    enabled: !!id,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert
        type="error"
        message="Failed to load project"
        description={error?.message || 'An error occurred while loading project details.'}
        action={
          <Button type="primary" onClick={() => window.location.reload()}>
            Retry
          </Button>
        }
        style={{ maxWidth: '800px', margin: '2rem auto' }}
      />
    );
  }

  if (!project) {
    return (
      <Alert
        type="warning"
        message="Project not found"
        description="The project you're looking for doesn't exist or has been deleted."
        action={
          <Button type="primary" onClick={() => navigate('/projects')}>
            Back to Projects
          </Button>
        }
        style={{ maxWidth: '800px', margin: '2rem auto' }}
      />
    );
  }

  const formattedDate = dayjs(project.createdAt).format('MMM D, YYYY [at] h:mm A');

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem' }}>
      <Button 
        type="text" 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate(-1)}
        style={{ marginBottom: '1rem' }}
      >
        Back to Projects
      </Button>
      
      <Card 
        title={
          <Space align="center">
            <Title level={3} style={{ margin: 0 }}>{project.name}</Title>
            <Tag color="blue">Active</Tag>
          </Space>
        }
      >
        <Descriptions bordered column={1}>
          <Descriptions.Item label="Description">
            {project.description || 'No description provided'}
          </Descriptions.Item>
          <Descriptions.Item label="Owner">
            <Link to={`/users/${project.ownerId}`}>
              {project.ownerName || 'Unknown'}
            </Link>
          </Descriptions.Item>
          <Descriptions.Item label="Created">
            {formattedDate}
          </Descriptions.Item>
          <Descriptions.Item label="Tasks">
            <Space direction="vertical" style={{ width: '100%' }}>
              {project.tasks && project.tasks.length > 0 ? (
                project.tasks.map(task => (
                  <div key={task.id}>
                    <Text strong>{task.title}</Text>
                    <Tag color={task.status === 'COMPLETED' ? 'success' : 'processing'} style={{ marginLeft: '8px' }}>
                      {task.status}
                    </Tag>
                  </div>
                ))
              ) : (
                <Text type="secondary">No tasks yet</Text>
              )}
              <Button 
                type="dashed" 
                onClick={() => navigate('/tasks/new', { state: { projectId: project.id } })}
                style={{ marginTop: '8px' }}
              >
                Add Task
              </Button>
            </Space>
          </Descriptions.Item>
        </Descriptions>
        
        <Divider />
        
        <div style={{ marginTop: '1rem', textAlign: 'right' }}>
          <Text type="secondary">
            Last updated: {dayjs(project.createdAt).fromNow()}
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default ProjectDetails;
