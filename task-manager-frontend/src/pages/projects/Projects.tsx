import React, { useState, useMemo } from 'react';
import { 
  Button, 
  Card, 
  Typography, 
  Space, 
  message, 
  Form, 
  Popconfirm, 
  Tooltip, 
  Statistic, 
  Row, 
  Col, 
  Input, 
  Avatar, 
  Alert,
  Table,
  Drawer
} from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  PlusOutlined, 
  SearchOutlined, 
  MoreOutlined, 
  UserOutlined,
  ArrowUpOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FolderOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import ProjectForm from '../../components/projects/ProjectForm';
import type { ProjectFormInputs } from '../../components/projects/ProjectForm';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProjects, createProject, updateProject, deleteProject } from '../../api/projects';
import type { Project } from '../../api/projects';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

// Extend the Project type to include status
declare module '../../api/projects' {
  interface Project {
    status?: 'ACTIVE' | 'INACTIVE' | 'COMPLETED' | 'ON_HOLD';
  }
}

const { Title, Text } = Typography;
// Search component removed as it's not used directly

const Projects: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const { data: projects = [], isLoading, isError } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => fetchProjects(),
    refetchOnWindowFocus: false,
  });

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const searchLower = searchText.toLowerCase();
      return project.name?.toLowerCase().includes(searchLower) ||
        (project.description || '').toLowerCase().includes(searchLower);
    });
  }, [projects, searchText]);

  const createMutation = useMutation({
    mutationFn: (values: ProjectFormInputs) => {
      if (!values.owner?.id) {
        throw new Error('Owner ID is required');
      }
      return createProject({
        name: values.name,
        description: values.description,
        owner: { id: Number(values.owner.id) },
        tasks: []
      });
    },
    onSuccess: () => {
      message.success('Project created');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setModalVisible(false);
      form.resetFields();
    },
    onError: (error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        message.error('You are not authorized. Please log in again.');
      } else {
        message.error('Failed to create project');
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...values }: { id: string } & ProjectFormInputs) => {
      return updateProject(id, {
        name: values.name,
        description: values.description,
        owner: { id: Number(values.owner.id) },
        tasks: [] // Initialize with empty array or handle tasks separately if needed
      });
    },
    onSuccess: () => {
      message.success('Project updated');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setModalVisible(false);
      setEditingProject(null);
      form.resetFields();
    },
    onError: (error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        message.error('You are not authorized. Please log in again.');
      } else {
        message.error('Failed to update project');
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteProject(id.toString()),
    onSuccess: () => {
      message.success('Project deleted');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to delete project');
    },
  });

  const handleCreate = () => {
    setEditingProject(null);
    setModalVisible(true);
    form.resetFields();
  };

  const handleDelete = (id: number | string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(numericId)) {
      console.error('Invalid project ID:', id);
      message.error('Failed to delete project: Invalid ID');
      return;
    }
    deleteMutation.mutate(numericId);
  };

  const columns: ColumnsType<Project> = [
    {
      title: 'Project Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Project) => (
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: 12 }}
          onClick={() => navigate(`/projects/${record.id}`)}
        >
          <Avatar 
            style={{ 
              backgroundColor: '#1890ff',
              color: '#fff',
              fontWeight: 'bold'
            }}
          >
            {text?.charAt(0)?.toUpperCase()}
          </Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>{text}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Updated {formatDistanceToNow(new Date(record.updatedAt || record.createdAt || new Date()), { addSuffix: true })}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => date ? new Date(date).toLocaleString() : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_: any, record: Project) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Space size="middle">
            <Tooltip title="Edit">
              <Button 
                type="text" 
                icon={<EditOutlined />} 
                onClick={() => {
                  setEditingProject(record);
                  setModalVisible(true);
                }}
              />
            </Tooltip>
            {isAdmin && (
              <Tooltip title="Delete">
                <Popconfirm
                  title="Are you sure you want to delete this project?"
                  onConfirm={(e) => handleDelete(record.id, e as React.MouseEvent)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button 
                    type="text" 
                    danger 
                    icon={<DeleteOutlined />} 
                    loading={deleteMutation.isPending}
                  />
                </Popconfirm>
              </Tooltip>
            )}
          </Space>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>Projects</Title>
            <Text type="secondary">Manage and track your projects</Text>
          </div>
          {isAdmin && (
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleCreate}
              size="large"
            >
              New Project
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic 
                title="Total Projects" 
                value={projects.length} 
                prefix={<FolderOutlined style={{ color: '#1890ff' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic 
                title="Active" 
                value={projects.filter((p: Project) => p.status === 'ACTIVE').length} 
                prefix={<ArrowUpOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic 
                title="Completed" 
                value={projects.filter((p: Project) => p.status === 'COMPLETED').length} 
                prefix={<CheckCircleOutlined style={{ color: '#722ed1' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic 
                title="On Hold" 
                value={projects.filter((p: Project) => p.status === 'ON_HOLD').length} 
                prefix={<ExclamationCircleOutlined style={{ color: '#faad14' }} />}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Input.Search
              placeholder="Search projects..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              style={{ width: 300 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </Card>
      </div>

      {isError && (
        <Alert 
          message="Error loading projects" 
          description="There was an error loading the projects. Please try again later." 
          type="error" 
          showIcon 
          style={{ marginBottom: 24 }}
        />
      )}

      <Card 
        className="project-list"
        bodyStyle={{ padding: 0 }}
      >
        <Table 
          columns={columns} 
          dataSource={filteredProjects}
          rowKey="id"
          loading={isLoading}
          onRow={(record: Project) => ({
            onClick: () => navigate(`/projects/${record.id}`),
            style: { cursor: 'pointer' },
          })}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total: number, range: [number, number]) => `${range[0]}-${range[1]} of ${total} projects`,
            size: 'default' as const
          }}
          scroll={{ x: true }}
        />
      </Card>
      <Drawer
        title={editingProject ? 'Edit Project' : 'New Project'}
        placement="right"
        width={500}
        onClose={() => {
          setModalVisible(false);
          setEditingProject(null);
          setOwnerUser(null);
          form.resetFields();
        }}
        open={modalVisible}
        footer={null}
      >
        <div style={{ padding: '16px 0' }}>
          <ProjectForm
            initialValues={editingProject ? {
              name: editingProject.name,
              description: editingProject.description,
              owner: { 
                id: String(editingProject.ownerId || '')
              }
            } : undefined}
            onSubmit={async (values) => {
              try {
                if (editingProject) {
                  await updateMutation.mutateAsync({
                    id: editingProject.id,
                    ...values,
                  });
                } else {
                  await createMutation.mutateAsync(values);
                }
                setModalVisible(false);
                setEditingProject(null);
                form.resetFields();
              } catch (error) {
                console.error('Error submitting form:', error);
              }
            }}
            loading={createMutation.isPending || updateMutation.isPending}
            error={createMutation.error?.message || updateMutation.error?.message}
            ownerUser={user ? {
              id: user.id,
              name: user.name,
              username: user.email.split('@')[0],
              email: user.email
            } : null}
          />
        </div>
      </Drawer>
    </div>
  );
};

export default Projects;


