import React, { useState } from 'react';
import { Button, Table, Typography, Space, Modal, message, Form, Spin, Popconfirm, Alert } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ProjectForm from '../../components/projects/ProjectForm';
import type { ProjectFormInputs } from '../../components/projects/ProjectForm';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusOutlined } from '@ant-design/icons';
import { fetchProjects, createProject, updateProject, deleteProject } from '../../api/projects';
import type { Project } from '../../api/projects';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const { Title } = Typography;

const Projects: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const { data: projects = [], isLoading, isError } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: fetchProjects as () => Promise<Project[]>,
    refetchOnWindowFocus: false,
  });


  const createMutation = useMutation({
    mutationFn: (values: ProjectFormInputs) => {
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
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => {
      message.success('Project deleted');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: () => message.error('Failed to delete project'),
  });

  const handleCreate = () => {
    setEditingProject(null);
    setModalVisible(true);
    form.resetFields();
  };

  const handleEdit = (project: Project) => {
    console.log('Editing project:', project);
    setEditingProject(project);
    setModalVisible(true);
    // Don't set form values here - let the ProjectForm component handle it through initialValues
  };

  const handleView = (id: string) => {
    navigate(`/projects/${id}`);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
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
      dataIndex: 'ownerName',
      key: 'ownerName',
      render: (name: string) => name || '-',
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
      render: (_: unknown, record: Project) => (
        <Space>
          <Button type="link" onClick={() => handleView(record.id)}>View</Button>
          {isAdmin && (
            <>
              <Button type="link" onClick={() => handleEdit(record)}>Edit</Button>
              <Popconfirm title="Are you sure delete this project?" onConfirm={() => handleDelete(record.id)} okText="Yes" cancelText="No">
                <Button type="link" danger loading={deleteMutation.isPending}>Delete</Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Projects</Title>
        {isAdmin && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>New Project</Button>
          )}
      </Space>
      {isLoading ? (
        <Spin />
      ) : isError ? (
        <Alert type="error" message="Failed to load projects." />
      ) : (
        <Table
           columns={columns}
           dataSource={projects ?? []}
           rowKey="id"
           pagination={{ pageSize: 8 }}
         />
      )}
      {modalVisible && (
        <Modal
          title={editingProject ? 'Edit Project' : 'New Project'}
          open={true}
          onCancel={() => { setModalVisible(false); setEditingProject(null); }}
          destroyOnClose
          footer={null}
        >
          {editingProject ? (
            <ProjectForm
              key={`edit-${editingProject.id}`}
              initialValues={{
                name: editingProject.name,
                description: editingProject.description || '',
                owner: { id: String(editingProject.owner?.id || editingProject.ownerId || '') }
              }}
              ownerUser={{
                id: String(editingProject.owner?.id || editingProject.ownerId || ''),
                username: editingProject.ownerName || 'Unknown',
                email: editingProject.owner?.email || editingProject.ownerName || ''
              }}
              loading={updateMutation.isPending}
              error={updateMutation.isError ? 'Failed to update project' : undefined}
              onSubmit={async (values: ProjectFormInputs) => {
                try {
                  await updateMutation.mutateAsync({
                    id: String(editingProject.id),
                    name: values.name,
                    description: values.description,
                    owner: { id: values.owner.id }
                  });
                  setModalVisible(false);
                  setEditingProject(null);
                } catch (error) {
                  console.error('Error updating project:', error);
                }
              }}
            />
          ) : (
            <ProjectForm
              key="create"
              loading={createMutation.isPending}
              error={createMutation.isError ? 'Failed to create project' : undefined}
              onSubmit={async (values: ProjectFormInputs) => {
                try {
                  await createMutation.mutateAsync({
                    ...values,
                    owner: { id: values.owner.id }
                  });
                  setModalVisible(false);
                } catch (error) {
                  console.error('Error creating project:', error);
                }
              }}
            />
          )}
        </Modal>
      )}
    </div>
  );
};

export default Projects;


