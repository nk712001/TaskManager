import React, { useState } from 'react';
import { Table, Button, Space, Typography, Spin, Alert, Modal, Form, message, Popconfirm } from 'antd';
import ProjectForm from '../../components/projects/ProjectForm';
import type { ProjectFormInputs } from '../../components/projects/ProjectForm';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
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

  const { data: projects, isLoading, isError } = useQuery<Project[]>({ queryKey: ['projects'], queryFn: fetchProjects });


  const createMutation = useMutation({
    mutationFn: (values: ProjectFormInputs) => {
      // Ensure ownerId is properly converted to a number
      const ownerId = typeof values.ownerId === 'string' ? parseInt(values.ownerId, 10) : values.ownerId;
      return createProject({
        name: values.name,
        description: values.description,
        owner: { id: ownerId },
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
    mutationFn: ({ id, ...values }: { id: string } & { name: string; description: string; owner: { id: number }; tasks: any[] }) => {
      // Ensure owner ID is properly handled
      const ownerId = typeof values.owner?.id === 'string' ? parseInt(values.owner.id, 10) : values.owner?.id;
      return updateProject(id, {
        ...values,
        owner: { id: ownerId }
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

  const handleEdit = async (project: Project) => {
    const ownerId = project.owner?.id || project.ownerId;
    const initialValues = {
      name: project.name,
      description: project.description,
      // Ensure ownerId is a string for the form
      ownerId: ownerId ? String(ownerId) : 
              project.ownerId ? String(project.ownerId) : '',
    };
    setEditingProject(project);
    setModalVisible(true);
    form.setFieldsValue(initialValues);
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
      render: (_, record) => (
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
      <Modal
        title={editingProject ? 'Edit Project' : 'New Project'}
        open={modalVisible}
        onCancel={() => { setModalVisible(false); setEditingProject(null); }}
        destroyOnClose
        footer={null}
      >
        <ProjectForm
          initialValues={editingProject || undefined}
          loading={createMutation.isPending || updateMutation.isPending}
          error={createMutation.isError ? 'Failed to create project' : updateMutation.isError ? 'Failed to update project' : undefined}
          
          onSubmit={async (values: ProjectFormInputs) => {
            try {
              if (editingProject) {
                // For update, use the updateProject API directly
                // Convert string ID to number for the backend
                await updateProject(String(editingProject.id), {
                  name: values.name,
                  description: values.description,
                  owner: { id: Number(values.ownerId) },
                  // Don't include tasks in the update
                  tasks: undefined
                });
                message.success('Project updated successfully');
                queryClient.invalidateQueries({ queryKey: ['projects'] });
                setModalVisible(false);
                setEditingProject(null);
              } else {
                // For create, use the createProject API directly
                await createProject({
                  name: values.name,
                  description: values.description,
                  owner: { id: Number(values.ownerId) }
                });
                message.success('Project created successfully');
                queryClient.invalidateQueries({ queryKey: ['projects'] });
                setModalVisible(false);
              }
            } catch (error) {
              console.error('Error saving project:', error);
              message.error('Failed to save project');
            }
          }}
        />
      </Modal>
    </div>
  );
};

export default Projects;


