import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, Spin, Alert, Button } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { fetchProjectById } from '../../api/projects';
import type { Project } from '../../api/projects';

const { Title, Paragraph, Text } = Typography;

const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuery<Project | undefined>({
    queryKey: ['project', id],
    queryFn: () => (id ? fetchProjectById(id) : Promise.resolve(undefined)),
    enabled: !!id,
  });

  if (isLoading) return <Spin />;
  if (isError) return <Alert type="error" message="Failed to load project details." />;
  if (!data) return <Alert type="info" message="Project not found." />;

  return (
    <Card style={{ maxWidth: 600, margin: '2rem auto' }}>
      <Title level={2}>{data.name}</Title>
      <Paragraph><Text strong>Description: </Text>{data.description}</Paragraph>
      <Paragraph><Text strong>Owner: </Text>{data.owner}</Paragraph>
      <Paragraph><Text strong>Created At: </Text>{data.createdAt}</Paragraph>
      <Button onClick={() => navigate(-1)} style={{ marginTop: 16 }}>Back to Projects</Button>
    </Card>
  );
};

export default ProjectDetails;
