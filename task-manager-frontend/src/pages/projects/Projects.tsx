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

const { Title } = Typography;


const Projects: React.FC = () => {
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery<Project[]>({ queryKey: ['projects'], queryFn: fetchProjects });

  const createMutation = useMutation({
    mutationFn: (values: { name: string; description: string; ownerId: string }) => createProject(values),
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
    mutationFn: ({ id, values }: { id: string; values: Partial<Omit<Project, 'id' | 'createdAt'>> }) => updateProject(id, values),
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
    setEditingProject(project);
    setModalVisible(true);
    form.setFieldsValue(project);
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
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => handleView(record.id)}>View</Button>
          <Button type="link" onClick={() => handleEdit(record)}>Edit</Button>
          <Popconfirm title="Are you sure delete this project?" onConfirm={() => handleDelete(record.id)} okText="Yes" cancelText="No">
            <Button type="link" danger loading={deleteMutation.isPending}>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Projects</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>New Project</Button>
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
      <Modal
        title={editingProject ? 'Edit Project' : 'New Project'}
        open={modalVisible}
        onCancel={() => { setModalVisible(false); setEditingProject(null); }}
        footer={null}
        destroyOnClose
      >
        <ProjectForm
          initialValues={editingProject || undefined}
          loading={createMutation.isPending || updateMutation.isPending}
          error={createMutation.isError ? 'Failed to create project' : updateMutation.isError ? 'Failed to update project' : undefined}
          onSubmit={(values: ProjectFormInputs) => {
            if (editingProject) {
              updateMutation.mutate({ id: editingProject.id, values: {
                name: values.name,
                description: values.description,
                ownerId: Number(values.ownerId)
              } }, {
                onSuccess: () => {
                  setModalVisible(false);
                  setEditingProject(null);
                }
              });
            } else {
              createMutation.mutate({
                name: values.name,
                description: values.description,
                ownerId: Number(values.ownerId)
              }, {
                onSuccess: () => {
                  setModalVisible(false);
                }
              });
            }
          }}
        />
      </Modal>
    </div>
  );
};

export default Projects;


