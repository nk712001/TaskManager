import React from 'react';
import { Table, Button, Space, Typography, Spin, Alert } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

interface Project {
  id: string;
  name: string;
  description: string;
  owner: string;
  createdAt: string;
}

const fetchProjects = async (): Promise<Project[]> => {
  // Replace with real API call
  // const { data } = await api.get('/v1/projects');
  // return data;
  return [
    {
      id: '1',
      name: 'Website Redesign',
      description: 'Update the company website for 2025',
      owner: 'Alice',
      createdAt: '2025-08-10',
    },
    {
      id: '2',
      name: 'Mobile App',
      description: 'Develop a new mobile app for iOS/Android',
      owner: 'Bob',
      createdAt: '2025-07-22',
    },
  ];
};

const columns: ColumnsType<Project> = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
    render: (text: string) => <b>{text}</b>,
  },
  {
    title: 'Description',
    dataIndex: 'description',
    key: 'description',
  },
  {
    title: 'Owner',
    dataIndex: 'owner',
    key: 'owner',
  },
  {
    title: 'Created At',
    dataIndex: 'createdAt',
    key: 'createdAt',
  },
  {
    title: 'Actions',
    key: 'actions',
    render: () => (
      <Space>
        <Button type="link">View</Button>
        <Button type="link">Edit</Button>
        <Button type="link" danger>Delete</Button>
      </Space>
    ),
  },
];

const Projects: React.FC = () => {
  const { data, isLoading, isError } = useQuery<Project[]>({ queryKey: ['projects'], queryFn: fetchProjects });

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Projects</Title>
        <Button type="primary" icon={<PlusOutlined />}>New Project</Button>
      </Space>
      {isLoading ? (
        <Spin />
      ) : isError ? (
        <Alert type="error" message="Failed to load projects." />
      ) : (
        <Table
          columns={columns}
          dataSource={data ?? []}
          rowKey="id"
          pagination={{ pageSize: 8 }}
        />
      )}
    </div>
  );
};

export default Projects;
