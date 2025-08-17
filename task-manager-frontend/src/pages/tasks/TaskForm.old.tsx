import React, { useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Button, Form, Input, Select, DatePicker, Typography, message, Spin } from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  fetchTaskById, 
  createTask, 
  updateTask,
  type Task
} from '../../api/tasks';
import { fetchProjectsForDropdown } from '../../api/projects';
import { fetchUsers } from '../../api/users';
import { useAuth } from '../../contexts/AuthContext';
import dayjs from 'dayjs';
import { Controller, useForm } from 'react-hook-form';

const { Title } = Typography;

type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

interface TaskFormValues {
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: dayjs.Dayjs | null;
  projectId: number | null;
  assigneeId: string | null;
}

interface TaskFormProps {
  isEdit?: boolean;
  taskId?: string;
  projectId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const statusOptions = [
  { value: 'PENDING' as const, label: 'Pending' },
  { value: 'IN_PROGRESS' as const, label: 'In Progress' },
  { value: 'COMPLETED' as const, label: 'Completed' },
  { value: 'CANCELLED' as const, label: 'Cancelled' },
];

const priorityOptions = [
  { value: 'LOW' as const, label: 'Low' },
  { value: 'MEDIUM' as const, label: 'Medium' },
  { value: 'HIGH' as const, label: 'High' },
];

const TaskForm: React.FC<TaskFormProps> = ({ isEdit = false, taskId, projectId, onSuccess, onCancel }) => {

const TaskForm: React.FC<TaskFormProps> = ({ isEdit = false }) => {
  const navigate = useNavigate();
  const { id: taskId } = useParams<{ id: string }>();
  const isEditMode = !!taskId;
  const location = useLocation();
  const queryClient = useQueryClient();
  const projectId = location.state?.projectId;
  const { user } = useAuth();

  const getCurrentUserId = (): number => {
    if (!user) {
      console.warn('No authenticated user found, using default creator ID');
      return 1; // Fallback to admin user
    }
    
    // Try to get the numeric user ID, fallback to 1 if not available
    const userId = user.userId || 1;
    console.log('Using creator ID:', userId, 'for user:', user.email);
    return userId;
  };

  const { control, handleSubmit, reset, formState: { errors } } = useForm<TaskFormValues>({
    defaultValues: {
      title: '',
      description: '',
      status: 'PENDING',
      priority: 'MEDIUM',
      projectId: projectId ? projectId : undefined,
      creatorId: 0, // Will be set when form is submitted
    },
  });

  // Fetch task data if in edit mode
  const { data: taskData, isLoading: isLoadingTask } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => taskId ? fetchTaskById(taskId) : null,
    enabled: !!taskId && isEdit,
  });

  // Fetch projects for the dropdown
  const { data: projectsResponse, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjectsForDropdown,
    enabled: !projectId, // Don't fetch if we already have a projectId from the URL
  });

  // Log projects data for debugging
  useEffect(() => {
    if (projectsResponse) {
      console.log('Fetched projects:', projectsResponse);
    }
  }, [projectsResponse]);

  // Format projects for the dropdown with name as label and id as value
  const projects = React.useMemo(() => {
    if (!projectsResponse) return [];
    
    return projectsResponse.map((project: { value: string; label: string }) => ({
      value: parseInt(project.value, 10), // Convert string ID to number
      label: project.label,
    }));
  }, [projectsResponse]);

  // Fetch users for the assignee dropdown
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  // Format users for the dropdown
  const userOptions = React.useMemo(() => {
    if (!usersData) return [];
    
    return usersData.map((user: any) => ({
      value: user.id,
      label: user.username || user.email,
    }));
  }, [usersData]);

  // Fetch users for the assignee dropdown
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    initialData: []
  });

  // Format users for the dropdown
  const userOptions = React.useMemo(() => 
    (usersData || []).map((user: any) => ({
      value: user.id,
      label: user.username || user.email,
    })),
    [usersData]
  );

  // Create and update mutations
  const createTaskMutation = useMutation({
    mutationFn: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'creator' | 'assignee'>) => createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: (data: Partial<Task> & { id: number }) => updateTask(data.id.toString(), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Reset form when task data is loaded or changes
  useEffect(() => {
    if (taskData) {
      const formValues: any = {
        title: taskData.title,
        description: taskData.description || '',
        status: taskData.status,
        priority: taskData.priority,
        projectId: taskData.projectId,
        assigneeId: taskData.assigneeId ?? null,
        creatorId: taskData.creatorId,
      };
      
      // Only set dueDate if it exists and is a valid date
      if (taskData.dueDate) {
        const dueDate = dayjs(taskData.dueDate);
        if (dueDate.isValid()) {
          formValues.dueDate = dueDate;
        }
      }
      
      reset(formValues);
    } else if (!isEdit) {
      // Reset to default values for new task
      const defaultValues = {
        title: '',
        description: '',
        status: 'PENDING' as const,
        priority: 'MEDIUM' as const,
        projectId: projectId ? projectId : undefined,
        creatorId: 0, // Will be set on submit
        dueDate: undefined,
      };
      reset(defaultValues);
    }
  }, [taskData, isEdit, reset, projectId]);

  const onSubmit = async (data: TaskFormValues) => {
    try {
      const taskData = {
        ...data,
        projectId: data.projectId,
        dueDate: data.dueDate ? data.dueDate.format('YYYY-MM-DDTHH:mm:ss') : undefined,
      };

      if (isEditMode && taskId) {
        await updateTaskMutation.mutateAsync({
          ...taskData,
          id: parseInt(taskId, 10)
        });
        message.success('Task updated successfully');
      } else {
        await createTaskMutation.mutateAsync({
          ...taskData,
          creatorId: Number(getCurrentUserId())
        });
        message.success('Task created successfully');
      }
      navigate(-1);
    } catch (error) {
      message.error(`Failed to ${isEditMode ? 'update' : 'create'} task`);
    }
  };

  const isLoading = isLoadingTask || createTaskMutation.isPending || updateTaskMutation.isPending;

  if (isLoadingTask) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
      <Space direction="vertical" size="middle" style={{ marginBottom: 24, width: '100%' }}>
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(-1)}
          style={{ marginBottom: 16 }}
        >
          Back to Tasks
        </Button>
        
        <Title level={3}>
          {isEdit ? 'Edit Task' : 'Create New Task'}
        </Title>
      </Space>

      <Card>
        <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
          <Form.Item
            label="Title"
            validateStatus={errors.title ? 'error' : ''}
            help={errors.title?.message}
          >
            <Controller
              name="title"
              control={control}
              rules={{ required: 'Title is required' }}
              render={({ field }) => (
                <Input 
                  {...field} 
                  placeholder="Enter task title" 
                  disabled={isLoading}
                />
              )}
            />
          </Form.Item>

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
                  disabled={isLoading}
                />
              )}
            />
          </Form.Item>

          <Form.Item
            label="Status"
            validateStatus={errors.status ? 'error' : ''}
            help={errors.status?.message}
          >
            <Controller
              name="status"
              control={control}
              rules={{ required: 'Status is required' }}
              render={({ field }) => (
                <Select
                  {...field}
                  options={statusOptions}
                  placeholder="Select status"
                  disabled={isLoading}
                  style={{ width: '100%' }}
                />
              )}
            />
          </Form.Item>

          <Form.Item
            label="Priority"
            validateStatus={errors.priority ? 'error' : ''}
            help={errors.priority?.message}
          >
            <Controller
              name="priority"
              control={control}
              rules={{ required: 'Priority is required' }}
              render={({ field }) => (
                <Select
                  {...field}
                  options={priorityOptions}
                  placeholder="Select priority"
                  disabled={isLoading}
                  style={{ width: '100%' }}
                />
              )}
            />
          </Form.Item>

          <Form.Item
            label="Due Date"
            validateStatus={errors.dueDate ? 'error' : ''}
            help={errors.dueDate?.message}
          >
            <Controller
              name="dueDate"
              control={control}
              render={({ field: { value, onChange, ...field } }) => {
                // Safely convert value to Day.js object
                const dateValue = React.useMemo(() => {
                  if (!value) return null;
                  if (dayjs.isDayjs(value) && value.isValid()) return value;
                  try {
                    // Handle both string and Date types safely
                    const dateString = typeof value === 'string' 
                      ? value 
                      : value instanceof Date 
                        ? value.toISOString() 
                        : String(value);
                    const d = dayjs(dateString);
                    return d.isValid() ? d : null;
                  } catch (e) {
                    console.warn('Invalid date value:', value, e);
                    return null;
                  }
                }, [value]);
                
                return (
                  <DatePicker
                    {...field}
                    value={dateValue}
                    onChange={(date) => {
                      // Only update if date is a valid Day.js object or null
                      onChange(date?.isValid() ? date : null);
                    }}
                    style={{ width: '100%' }}
                    disabled={isLoading}
                    format="YYYY-MM-DD"
                  />
                );
              }}
            />
          </Form.Item>

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
                  showSearch
                  placeholder="Select a project"
                  optionFilterProp="label"
                  options={projects}
                  loading={isLoading || isLoadingProjects}
                  disabled={isLoading || isLoadingProjects || !!projectId}
                  value={field.value}
                  onChange={(value: number) => field.onChange(value)}
                  onClear={() => field.onChange(undefined)}
                  allowClear
                  style={{ width: '100%' }}
                />
              )}
            />
          </Form.Item>

          <Form.Item
            label="Assignee"
            validateStatus={errors.assigneeId ? 'error' : ''}
            help={errors.assigneeId?.message}
          >
            <Controller
              name="assigneeId"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  showSearch
                  placeholder="Select an assignee"
                  optionFilterProp="label"
                  options={userOptions}
                  loading={isLoadingUsers}
                  disabled={isLoading}
                  allowClear
                  style={{ width: '100%' }}
                />
              )}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={isLoading}
              >
                {isEditMode ? 'Update Task' : 'Create Task'}
              </Button>
              <Button onClick={() => navigate(-1)} disabled={isLoading}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default TaskForm;
