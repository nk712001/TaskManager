import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Col, DatePicker, Form, Input, Row, Select, Space, Typography, message } from 'antd';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dayjs from 'dayjs';
// Define Task interface that matches our API
type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

interface Task {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  projectId: number;
  assigneeId?: number | null;
  creatorId: number;
  createdAt: string;
  updatedAt: string;
  creator?: { id: number; name?: string; email: string };
  assignee?: { id: number; name?: string; email: string } | null;
}

import { createTask, updateTask, fetchTaskById } from '../../api/tasks';
import { fetchProjects } from '../../api/projects';
import { fetchUsers } from '../../api/users';
import { useAuth } from '../../contexts/AuthContext';

// Status and priority options
const statusOptions: { value: Task['status']; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const priorityOptions: { value: Task['priority']; label: string }[] = [
  { value: 'LOW' as const, label: 'Low' },
  { value: 'MEDIUM' as const, label: 'Medium' },
  { value: 'HIGH' as const, label: 'High' },
];

// Remove unused types

// Define form values type
type TaskFormValues = {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: dayjs.Dayjs | null;
  projectId: string;
  assigneeId?: string | null;
  creatorId: string;
};

// Form schema using Zod
const taskFormSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title cannot exceed 100 characters'),
  description: z.string()
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH'] as const),
  dueDate: z.any()
    .transform((val) => {
      if (!val) return null;
      return dayjs.isDayjs(val) ? val : dayjs(val);
    })
    .optional()
    .nullable(),
  projectId: z.string().min(1, 'Please select a project'),
  assigneeId: z.string().nullable().optional(),
  creatorId: z.string().min(1, 'Creator is required'),
}) as z.ZodType<TaskFormValues>;

interface Project {
  id: string;
  name: string;
}

interface User {
  id: string;
  name?: string;
  email: string;
}

interface TaskFormProps {
  isEdit?: boolean;
}

const TaskForm: React.FC<TaskFormProps> = ({ isEdit = false }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const methods = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema as any), // Type assertion to handle the resolver type
    defaultValues: {
      title: '',
      description: '',
      status: 'PENDING',
      priority: 'MEDIUM',
      dueDate: null,
      projectId: '',
      assigneeId: null,
      creatorId: user?.id ? String(user.id) : '',
    },
  });

  const { handleSubmit, control, reset, formState: { errors } } = methods;

  // Fetch projects
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });

  // Fetch users for assignee dropdown
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  // Fetch task data if in edit mode
  const { data: task, isLoading: isLoadingTask } = useQuery<Task>({
    queryKey: ['task', id],
    queryFn: () => {
      if (!id) return Promise.reject(new Error('No task ID provided'));
      return fetchTaskById(id);
    },
    enabled: isEdit && !!id,
  });

  // Set form values when task data is loaded
  React.useEffect(() => {
    if (task) {
      reset({
        ...task,
        projectId: String(task.projectId),
        assigneeId: task.assigneeId ? String(task.assigneeId) : null,
        creatorId: String(task.creatorId),
        dueDate: task.dueDate ? dayjs(task.dueDate) : null,
      });
    }
  }, [task, reset]);



  // Mutations for create and update
  const createMutation = useMutation({
    mutationFn: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'creator' | 'assignee'>) => 
      createTask(data as any), // Type assertion needed due to API type mismatch
    onSuccess: () => {
      message.success('Task created successfully');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      navigate('/tasks');
    },
    onError: () => {
      message.error('Failed to create task');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (params: { id: string; data: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'creator' | 'assignee'>> }) => 
      updateTask(params.id, params.data as any), // Type assertion needed due to API type mismatch
    onSuccess: () => {
      message.success('Task updated successfully');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      navigate('/tasks');
    },
    onError: () => {
      message.error('Failed to update task');
    },
  });

  const onSubmit = async (formData: TaskFormValues) => {
    try {
      // Prepare the data for API submission
      const apiData = {
        title: formData.title,
        description: formData.description || undefined,
        status: formData.status,
        priority: formData.priority,
        projectId: Number(formData.projectId),
        creatorId: Number(formData.creatorId),
        assigneeId: formData.assigneeId ? Number(formData.assigneeId) : null,
        dueDate: formData.dueDate ? formData.dueDate.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]') : null,
      };

      if (isEdit && id) {
        await updateMutation.mutateAsync({ 
          id, 
          data: apiData as Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'creator' | 'assignee'>
        });
      } else {
        await createMutation.mutateAsync(apiData as Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'creator' | 'assignee'>);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      message.error('Failed to save task');
    }
  };

  if (isLoadingTask) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <Typography.Title level={3}>
          Loading...
        </Typography.Title>
      </div>
    );
  }

  return (
    <div>
      <Typography.Title level={3} style={{ marginBottom: '24px' }}>
        {isEdit ? 'Edit Task' : 'Create New Task'}
      </Typography.Title>
      <FormProvider {...methods}>
        <Card>
          <form onSubmit={handleSubmit(onSubmit as SubmitHandler<TaskFormValues>)}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Title"
                  validateStatus={errors.title ? 'error' : ''}
                  help={errors.title?.message}
                >
                  <Controller
                    name="title"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="Enter task title"
                        size="large"
                      />
                    )}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Status"
                  validateStatus={errors.status ? 'error' : ''}
                  help={errors.status?.message}
                >
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        placeholder="Select status"
                        options={statusOptions}
                        size="large"
                      />
                    )}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Priority"
                  validateStatus={errors.priority ? 'error' : ''}
                  help={errors.priority?.message}
                >
                  <Controller
                    name="priority"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        placeholder="Select priority"
                        options={priorityOptions}
                        size="large"
                      />
                    )}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Due Date"
                  validateStatus={errors.dueDate ? 'error' : ''}
                  help={errors.dueDate?.message}
                >
                  <Controller
                    name="dueDate"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        {...field}
                        style={{ width: '100%' }}
                        format="YYYY-MM-DD"
                        size="large"
                      />
                    )}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Project"
                  validateStatus={errors.projectId ? 'error' : ''}
                  help={errors.projectId?.message}
                >
                  <Controller
                    name="projectId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        loading={isLoadingProjects}
                        placeholder="Select project"
                        options={projects.map((project) => ({
                          value: project.id.toString(),
                          label: project.name,
                        }))}
                        size="large"
                      />
                    )}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Assignee"
                  validateStatus={errors.assigneeId ? 'error' : ''}
                  help={errors.assigneeId?.message}
                >
                  <Controller
                    name="assigneeId"
                    control={control}
                    render={({ field: { value, onChange, ...field } }) => (
                      <Select
                        {...field}
                        value={value !== undefined && value !== null ? value.toString() : null}
                        onChange={(val) => onChange(val ? val : null)}
                        loading={isLoadingUsers}
                        placeholder="Select assignee"
                        options={[
                          { value: null, label: 'Unassigned' },
                          ...users.map(user => ({
                            value: user.id.toString(),
                            label: user.username || user.email
                          }))
                        ]}
                        optionFilterProp="label"
                        showSearch
                        size="large"
                      />
                    )}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="Description"
              validateStatus={errors.description ? 'error' : ''}
              help={errors.description?.message}
            >
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <Input.TextArea
                    {...field}
                    rows={4}
                    placeholder="Enter task description"
                  />
                )}
              />
            </Form.Item>

            <div style={{ marginTop: '24px', textAlign: 'right' }}>
              <Space>
                <Button onClick={() => navigate(-1)}>Cancel</Button>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={createMutation.isPending || updateMutation.isPending}
                >
                  {isEdit ? 'Update Task' : 'Create Task'}
                </Button>
              </Space>
            </div>
          </form>
        </Card>
      </FormProvider>
    </div>
  );
};

export default TaskForm;
