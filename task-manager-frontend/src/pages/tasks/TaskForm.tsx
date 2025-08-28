import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Col, DatePicker, Form, Input, Row, Select, Space, Spin, Alert, message } from 'antd';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import dayjs, { Dayjs } from 'dayjs';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { type Task } from '../../api/tasks';
import { fetchProjects } from '../../api/projects';
import { fetchUsersForDropdown, type UserDropdownOption } from '../../api/users';
import { useAuth } from '../../contexts/AuthContext';
import { useCreateTask, useUpdateTask } from '../../hooks/useTasks';

// Types and interfaces
type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

interface Project {
  id: string;
  name: string;
}

interface TaskFormProps {
  task?: any; // Task data when editing
  initialValues?: Record<string, any>; // Initial values for the form
  projectId?: string; // Current project ID to auto-select
  onSuccess?: () => void;
  onCancel?: () => void;
  loading?: boolean;
  error?: string | null;
}

// Form values type
interface TaskFormValues {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;  // Keep as string for form handling
  assigneeId: string | null;
  creatorId: string;
  dueDate: Dayjs | null;
  creator?: {
    id: number;
    email?: string;
    username?: string;
  };
  id?: number;
  email?: string;
  username?: string;
  assignee?: {
    id: number;
    email?: string;
    username?: string;
  };
}

// API data type (what we send to the server)
interface TaskAPIData {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: number;
  assigneeId: number | null;
  creatorId: number;
  dueDate?: string;
}

// Status and priority options
const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: 'LOW' as const, label: 'Low' },
  { value: 'MEDIUM' as const, label: 'Medium' },
  { value: 'HIGH' as const, label: 'High' },
];


// Form schema using Zod
const taskFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  projectId: z.string().min(1, 'Project is required'),
  assigneeId: z.string().nullable(),
  creatorId: z.string().min(1, 'Creator is required'),
  dueDate: z.any().optional(),
});

const TaskForm: React.FC<TaskFormProps> = ({
  task: initialTask,
  initialValues = {},
  projectId,
  onSuccess,
  onCancel,
  loading = false,
  error = null
}) => {
  const { user } = useAuth();
  const isEdit = !!initialTask;
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();

  const formMethods = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema as any),
    defaultValues: {
      title: '',
      description: '',
      status: 'PENDING',
      priority: 'MEDIUM',
      projectId: projectId ? String(projectId) : (initialValues?.projectId ? String(initialValues.projectId) : ''),
      assigneeId: null,
      creatorId: String(user?.id || ''),
      creator: user ? { 
        id: Number(user.id), 
        email: user.email || '', 
        username: user.username || user.email?.split('@')[0] || 'User' 
      } : undefined,
      dueDate: null,
      ...initialValues,
    },
  });

  const { handleSubmit, control, reset, watch, formState: { errors } } = formMethods;
  const creator = watch('creator');

  // Set initial form values when initialTask or projectId changes
  React.useEffect(() => {
    console.log('[TaskForm] useEffect - initialTask:', initialTask);
    console.log('[TaskForm] useEffect - projectId:', projectId);
    
    if (initialTask) {
      const formValues = {
        ...initialTask,
        projectId: initialTask.projectId?.toString() || projectId?.toString() || '',
        assigneeId: initialTask.assigneeId?.toString() || null,
        creatorId: initialTask.creatorId?.toString() || user?.id?.toString() || '',
        creator: initialTask.creator || (user ? { 
          id: Number(user.id), 
          email: user.email || '', 
          username: user.username || user.email?.split('@')[0] || 'User' 
        } : undefined),
        dueDate: initialTask.dueDate ? dayjs(initialTask.dueDate) : null,
      };
      console.log('[TaskForm] Setting form values from initialTask:', formValues);
      reset(formValues);
    } else if (projectId) {
      const defaultValues = {
        title: '',
        description: '',
        status: 'PENDING',
        priority: 'MEDIUM',
        projectId: projectId.toString(),
        assigneeId: null,
        creatorId: user?.id?.toString() || '',
        creator: user ? { 
          id: Number(user.id), 
          email: user.email || '', 
          username: user.username || user.email?.split('@')[0] || 'User' 
        } : undefined,
        dueDate: null,
      };
      console.log('[TaskForm] Setting default form values:', defaultValues);
      reset(defaultValues);
    }
  }, [initialTask, projectId, reset, user?.id]);

  // Fetch projects
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: fetchProjects,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch users for assignee dropdown
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<UserDropdownOption[]>({
    queryKey: ['users'],
    queryFn: fetchUsersForDropdown,
  });

  // Transform task data to form values
  const task = React.useMemo((): TaskFormValues | null => {
    if (!initialTask) return null;
    return {
      ...initialTask,
      projectId: String(initialTask.projectId || ''),
      creatorId: String(initialTask.creatorId || user?.id || ''),
      creator: initialTask.creator || { 
        id: initialTask.creatorId, 
        username: user?.username || user?.email?.split('@')[0] || 'User',
        email: user?.email
      },
      assigneeId: initialTask.assigneeId ? String(initialTask.assigneeId) : null,
      dueDate: initialTask.dueDate ? dayjs(initialTask.dueDate) : null,
    } as unknown as TaskFormValues;
  }, [initialTask, user?.id, user?.username, user?.email]);

  // Handle task creation with proper type conversion
  const handleCreateTask = async (apiData: TaskAPIData) => {
    return await createTaskMutation.mutateAsync(apiData);
  };

  const handleUpdateTask = async (id: string, data: TaskAPIData) => {
    return await updateTaskMutation.mutateAsync({ id, ...data });
  };

  const onSubmit: SubmitHandler<TaskFormValues> = async (formValues) => {
    try {
      console.log('[TaskForm] onSubmit - Raw form values:', JSON.stringify(formValues, null, 2));
      
      // Log the types of each field
      const fieldTypes = Object.entries(formValues).reduce((acc, [key, value]) => {
        acc[key] = {
          type: typeof value,
          value: value,
          isDayjs: value && typeof value === 'object' && 'isValid' in value && value.isValid?.()
        };
        return acc;
      }, {} as Record<string, { type: string; value: any; isDayjs?: boolean }>);
      
      console.log('[TaskForm] Field types before conversion:', fieldTypes);

      const apiData: TaskAPIData = {
        title: formValues.title,
        description: formValues.description,
        status: formValues.status,
        priority: formValues.priority,
        projectId: Number(formValues.projectId),
        assigneeId: formValues.assigneeId ? Number(formValues.assigneeId) : null,
        creatorId: Number(user?.id),
        dueDate: formValues.dueDate ? formValues.dueDate.toISOString() : undefined,
      };

      console.log('[TaskForm] Processed API data:', apiData);

      if (isEdit && initialTask?.id) {
        console.log('[TaskForm] Updating task with ID:', initialTask.id);
        await handleUpdateTask(initialTask.id, apiData);
      } else {
        console.log('[TaskForm] Creating new task');
        await handleCreateTask(apiData);
      }
      onSuccess?.();
    } catch (error) {
      console.error('[TaskForm] Error submitting form:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...(error.response && { response: error.response.data })
      });
      message.error(`Failed to ${isEdit ? 'update' : 'create'} task`);
      throw error;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error"
        description={error.toString()}
        type="error"
        showIcon
        style={{ marginBottom: 16 }}
      />
    );
  }

  return (
    <FormProvider {...formMethods}>
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                name="projectId"
                rules={[{ required: true, message: 'Please select a project' }]}
                help={errors.projectId?.message}
                validateStatus={errors.projectId ? 'error' : ''}
              >
                <Controller
                  name="projectId"
                  control={control}
                  render={({ field }) => {
                    // Find the selected project to get its name
                    const selectedProject = projects.find(p => 
                      p.id.toString() === field.value?.toString()
                    );
                    
                    // In create mode, show the project name from the projectId prop
                    if (!isEdit && projectId) {
                      const projectForCreate = projects.find(p => 
                        p.id.toString() === projectId.toString()
                      );
                      return (
                        <Input 
                          value={projectForCreate?.name || projectId}
                          size="large"
                          disabled={true}
                        />
                      );
                    }
                    
                    // In edit mode, show the project name if available
                    return (
                      <Input 
                        value={selectedProject?.name || field.value || ''}
                        size="large"
                        disabled={true}
                      />
                    );
                  }}
                />
              </Form.Item>
            </Col>
            {!isEdit && (
              <Col span={12}>
                <Form.Item label="Creator">
                  <Input
                    value={creator?.username || 'Unknown'}
                    disabled
                    size="large"
                  />
                </Form.Item>
              </Col>
            )}
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Assignee">
                <Controller
                  name="assigneeId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      showSearch
                      placeholder="Select an assignee"
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                      options={users}
                      loading={isLoadingUsers}
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
              <Button
                onClick={onCancel}
                disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createTaskMutation.isPending || updateTaskMutation.isPending}
              >
                {isEdit ? 'Update Task' : 'Create Task'}
              </Button>
            </Space>
          </div>
        </form>
      </Card>
    </FormProvider >
  );
};

export default TaskForm;
