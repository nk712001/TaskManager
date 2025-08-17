import React, { useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Button, Card, Form, Input, Select, DatePicker, Space, Typography, message, Spin } from 'antd';
const { Title } = Typography;
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createTask, fetchTaskById, updateTask, type Task } from '../../api/tasks';
import { fetchProjectsForDropdown } from '../../api/projects';
import { fetchUsers } from '../../api/users';
import { useAuth } from '../../contexts/AuthContext';
import dayjs from 'dayjs';
import { useForm, Controller, useWatch } from 'react-hook-form';

interface TaskFormValues {
  title: string;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate?: dayjs.Dayjs;
  projectId?: number;
  assigneeId?: number | null;
  creatorId: number;
};

const statusOptions = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const priorityOptions = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
];

interface TaskFormProps {
  isEdit?: boolean;
}

const TaskForm: React.FC<TaskFormProps> = ({ isEdit = false }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
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
      projectId: projectId ? Number(projectId) : undefined,
      creatorId: user?.id ? Number(user.id) : 0,
    },
  });

  // Fetch task data if in edit mode
  const { data: taskData, isLoading: isLoadingTask, error: taskError } = useQuery<Task>({
    queryKey: ['task', id],
    queryFn: () => {
      if (!id) throw new Error('Task ID is required');
      return fetchTaskById(id);
    },
    enabled: isEdit && !!id,
  });

  // Reset form when task data is loaded or changes
  useEffect(() => {
    if (taskData) {
      console.log('Setting form values with task data:', taskData);
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
        } else {
          console.warn('Invalid due date in task data:', taskData.dueDate);
        }
      }
      
      console.log('Resetting form with values:', formValues);
      reset(formValues);
    } else if (!isEdit) {
      // Reset to default values for new task
      const defaultValues = {
        title: '',
        description: '',
        status: 'PENDING' as const,
        priority: 'MEDIUM' as const,
        projectId: projectId ? Number(projectId) : undefined,
        creatorId: user?.id ? Number(user.id) : 0,
        dueDate: undefined,
      };
      console.log('Resetting to default values:', defaultValues);
      reset(defaultValues);
    }
  }, [taskData, isEdit, reset, projectId, user]);

  // Log any errors
  useEffect(() => {
    if (taskError) {
      console.error('Error loading task:', taskError);
      message.error('Failed to load task data');
    }
  }, [taskError]);

  // Project dropdown with proper data handling
  const { 
    data: projects = [], 
    isLoading: isLoadingProjects,
    error: projectsError 
  } = useQuery<Array<{ value: string; label: string }>>({
    queryKey: ['projects'],
    queryFn: async (): Promise<Array<{ value: string; label: string }>> => {
      console.log('Fetching projects...');
      try {
        const data = await fetchProjectsForDropdown();
        console.log('Fetched projects:', data);
        return data;
      } catch (error) {
        console.error('Error in projects query:', error);
        throw error;
      }
    },
  });
  
  // Log query state changes
  useEffect(() => {
    if (projects) {
      console.log('Projects query successful:', projects);
    }
    if (projectsError) {
      console.error('Projects query failed:', projectsError);
    }
  }, [projects, projectsError]);
  
  // Log form state changes
  const formValues = useWatch({ control });
  
  // Log project selection state
  useEffect(() => {
    if (formValues?.projectId !== undefined) {
      const selectedProject = projects.find(p => p.value === String(formValues.projectId));
      console.log('Project selection updated:', {
        selectedProjectId: formValues.projectId,
        selectedProject,
        availableProjects: projects,
        projectIdFromProps: projectId,
        isEditMode: isEdit
      });
    }
  }, [formValues, projects]);
  
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    select: (users) => 
      users.map(user => ({
        value: Number(user.id), // Ensure value is a number
        label: user.username || user.email,
      })),
  });

  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      message.success('Task created successfully');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      navigate('/tasks');
    },
    onError: (error: any) => {
      console.error('Create task error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create task';
      message.error(`Failed to create task: ${errorMessage}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'creator' | 'assignee'>> }) => 
      updateTask(id, data),
    onSuccess: () => {
      message.success('Task updated successfully');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      navigate('/tasks');
    },
    onError: (error: any) => {
      console.error('Update task error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update task';
      message.error(`Failed to update task: ${errorMessage}`);
    },
  });

  const onSubmit = async (formValues: TaskFormValues) => {
    if (isLoading || updateMutation.isPending || createMutation.isPending) return;
    
    // Get the current user's numeric ID
    const creatorId = getCurrentUserId();
    console.log('Using creatorId:', creatorId, 'for task creation');

    try {
      console.log('Form values:', formValues);
      
      // Prepare the task data with proper types and validation
      const taskData = {
        title: formValues.title.trim(),
        description: formValues.description?.trim(),
        status: formValues.status,
        priority: formValues.priority,
        // Format as ISO string with time component for LocalDateTime
        dueDate: formValues.dueDate && dayjs.isDayjs(formValues.dueDate) && formValues.dueDate.isValid() 
          ? formValues.dueDate.set('hour', 12).set('minute', 0).set('second', 0).toISOString()
          : undefined,
        projectId: Number(formValues.projectId),
        assigneeId: formValues.assigneeId ? Number(formValues.assigneeId) : null,
        creatorId: creatorId,
      };
      
      console.log('Task data being sent:', taskData);
      
      // Final check - ensure we have a valid creator ID
      if (!taskData.creatorId) {
        console.error('Missing creatorId in task data');
        message.error('Failed to identify the task creator. Please refresh and try again.');
        return;
      }
      
      console.log('Sending to API:', taskData);

      if (isEdit && id) {
        await updateMutation.mutateAsync({ 
          id, 
          data: taskData 
        });
      } else {
        if (!taskData.projectId || taskData.projectId <= 0) {
          message.error('Project is required');
          return;
        }
        await createMutation.mutateAsync(taskData);
      }
    } catch (error) {
      console.error('Error submitting task:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      message.error(`Failed to save task: ${errorMessage}`);
    }
  };

  const isLoading = isLoadingTask || createMutation.isPending || updateMutation.isPending;

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
              render={({ field: { value, onChange, ...field } }) => {
                // Convert value to string for the Select component
                const stringValue = value !== undefined && value !== null ? String(value) : undefined;
                
                // Log the current state for debugging
                const debugInfo = {
                  fieldValue: value,
                  stringValue,
                  availableProjects: projects,
                  isEditMode: isEdit,
                  projectIdFromProps: projectId
                };
                console.log('Project field state:', debugInfo);
                
                // Handle project selection change
                const handleChange = (val: string | null) => {
                  console.log('Project selection changed:', { from: value, to: val });
                  // Convert back to number for the form
                  const numValue = val ? Number(val) : undefined;
                  onChange(numValue);
                };
                
                return (
                  <Select<string | null>
                    {...field}
                    value={stringValue}
                    onChange={handleChange}
                    showSearch
                    placeholder={
                      isLoadingProjects 
                        ? 'Loading projects...' 
                        : projects.length === 0 
                          ? 'No projects available' 
                          : 'Select a project'
                    }
                    optionFilterProp="label"
                    options={projects.map(p => ({
                      value: p.value,
                      label: p.label,
                      disabled: false
                    }))}
                    loading={isLoadingProjects}
                    disabled={isLoading || isLoadingProjects || (!!projectId && isEdit)}
                    allowClear={!projectId}
                    filterOption={(input, option) => {
                      const label = option?.label;
                      const labelStr = typeof label === 'string' 
                        ? label 
                        : typeof label === 'number' 
                          ? label.toString() 
                          : '';
                      return labelStr.toLowerCase().includes(input.toLowerCase());
                    }}
                    style={{ width: '100%' }}
                    notFoundContent={
                      isLoadingProjects 
                        ? 'Loading projects...' 
                        : 'No projects found. Please create a project first.'
                    }
                  />
                );
              }}
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
                  options={users}
                  allowClear
                  loading={isLoadingUsers}
                  disabled={isLoading}
                  filterOption={(input, option) =>
                    (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                  }
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
                {isEdit ? 'Update Task' : 'Create Task'}
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
