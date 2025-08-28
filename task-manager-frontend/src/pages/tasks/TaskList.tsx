import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { 
  Button, Card, Col, Drawer, Form, Input, Row, Select, Space, Table, Tag, Typography, message, Modal 
} from 'antd';
import { DatePicker } from 'antd';
import { 
  SearchOutlined, FilterOutlined, ReloadOutlined, EditOutlined, DeleteOutlined 
} from '@ant-design/icons';
import type { Task as TaskType, UserRef } from '../../api/tasks';
import api from '../../api/axios';
import dayjs from 'dayjs';
import TaskForm from './TaskForm';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  fetchTasks, type TaskListResponse, emptyTaskListResponse, type TaskFilters 
} from '../../api/tasks';
import { fetchProjectsForDropdown } from '../../api/projects';
import { fetchUsersForDropdown } from '../../api/users';

const { Text } = Typography;
const { RangePicker } = DatePicker;

const statusOptions = [
  { value: 'PENDING', label: 'Pending', color: 'orange' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'blue' },
  { value: 'COMPLETED', label: 'Completed', color: 'green' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'red' },
];

const priorityOptions = [
  { value: 'LOW', label: 'Low', color: 'default' },
  { value: 'MEDIUM', label: 'Medium', color: 'orange' },
  { value: 'HIGH', label: 'High', color: 'red' },
];

interface FilterFormValues {
  search?: string;
  status?: string[];
  priority?: string[];
  assigneeId?: string[];
  projectId?: string;
  dateRange?: [dayjs.Dayjs | null, dayjs.Dayjs | null];
}

const TaskList: React.FC = () => {
  const queryClient = useQueryClient();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null);
  const [form] = Form.useForm<FilterFormValues>();
  
  // Parse URL params for pagination and filters (0-based page index)
  const page = parseInt(searchParams.get('page') || '0', 10);
  const pageSize = parseInt(searchParams.get('limit') || '10', 10);
  
  // Convert URL params to form initial values
  const initialFilters: FilterFormValues = {};
  
  // Handle array params
  (['status', 'priority', 'assigneeId'] as const).forEach((key) => {
    const value = searchParams.get(key);
    if (value) {
      // Type assertion needed because TypeScript can't infer the array type
      (initialFilters as any)[key] = value.split(',');
    }
  });
  
  // Handle date range
  const dueDateFrom = searchParams.get('dueDateFrom');
  const dueDateTo = searchParams.get('dueDateTo');
  if (dueDateFrom || dueDateTo) {
    initialFilters.dateRange = [
      dueDateFrom ? dayjs(dueDateFrom) : null,
      dueDateTo ? dayjs(dueDateTo) : null,
    ] as [dayjs.Dayjs | null, dayjs.Dayjs | null];
  }
  
  // Handle single value params
  (['search', 'projectId'] as const).forEach((key) => {
    const value = searchParams.get(key);
    if (value) {
      (initialFilters as any)[key] = value;
    }
  });
  
  // Handle filter form submission
  const handleFilterSubmit = (values: FilterFormValues) => {
    console.log('Form submitted with values:', values);
    const params = new URLSearchParams();
    
    // Set pagination params
    params.set('page', '0'); // Reset to first page when filters change
    params.set('limit', pageSize.toString());
    
    // Set simple fields
    if (values.search) params.set('search', values.search);
    if (values.projectId) params.set('projectId', values.projectId);
    
    // Set array fields
    if (values.status?.length) params.set('status', values.status.join(','));
    if (values.priority?.length) params.set('priority', values.priority.join(','));
    if (values.assigneeId?.length) params.set('assigneeId', values.assigneeId.join(','));
    
    // Set date range
    if (values.dateRange?.[0]) params.set('dueDateFrom', values.dateRange[0].format('YYYY-MM-DD'));
    if (values.dateRange?.[1]) params.set('dueDateTo', values.dateRange[1].format('YYYY-MM-DD'));
    
    console.log('Updating URL with params:', params.toString());
    setSearchParams(params);
  };
  
  // Handle reset filters
  const handleResetFilters = () => {
    form.resetFields();
    setSearchParams({ page: '0', limit: pageSize.toString() });
  };

  // Set initial form values
  useEffect(() => {
    form.setFieldsValue(initialFilters);
  }, [searchParams.toString()]);
  
  // Prepare API filters from form values
  const prepareApiFilters = (values: FilterFormValues): TaskFilters => {
    const filters: TaskFilters = {};
    
    // Copy simple fields
    if (values.search) filters.search = values.search;
    if (values.projectId) filters.projectId = values.projectId;
    
    // Copy array fields
    if (values.status?.length) filters.status = values.status;
    if (values.priority?.length) filters.priority = values.priority;
    if (values.assigneeId?.length) filters.assigneeId = values.assigneeId;
    
    // Handle date range
    if (values.dateRange?.[0] && values.dateRange[1]) {
      filters.dueDateFrom = values.dateRange[0].format('YYYY-MM-DD');
      filters.dueDateTo = values.dateRange[1].format('YYYY-MM-DD');
    }
    
    return filters;
  };
  
  // Prepare API filters from initial filters
  const preparedFilters = useMemo(() => {
    const filters = prepareApiFilters(initialFilters);
    console.log('Prepared filters:', filters);
    return filters;
  }, [initialFilters]);
  
  console.log('Rendering TaskList with page:', page, 'pageSize:', pageSize);
  console.log('Current preparedFilters:', preparedFilters);
  
  // Fetch projects for the project filter
  const { 
    data: projects = [], 
    isLoading: isLoadingProjects,
    error: projectsError 
  } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjectsForDropdown,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch users for assignee dropdown
  const { 
    data: users = [], 
    isLoading: isLoadingUsers,
    error: usersError 
  } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsersForDropdown,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Show error message if projects fail to load
  useEffect(() => {
    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
      message.error('Failed to load projects');
    }
  }, [projectsError]);

  // Format projects for the Select component with better error handling
  const projectOptions = useMemo(() => {
    try {
      if (!projects || !Array.isArray(projects)) {
        console.warn('Invalid projects data:', projects);
        return [];
      }
      return projects.map(project => ({
        value: project.value,
        label: project.label || `Project ${project.value}`,
      }));
    } catch (error) {
      console.error('Error formatting project options:', error);
      return [];
    }
  }, [projects]);

  // Format users for the Select component with better error handling
  const assigneeOptions = useMemo(() => {
    try {
      if (!users || !Array.isArray(users)) {
        console.warn('Invalid users data:', users);
        return [];
      }
      return users.map(user => ({
        value: user.value,
        label: user.label || `User ${user.value}`,
      }));
    } catch (error) {
      console.error('Error formatting assignee options:', error);
      return [];
    }
    return users.map(user => ({
      value: user.value,
      label: user.label,
    }));
  }, [users]);

  // Fetch tasks with current filters and pagination
  console.log('Setting up useQuery with key:', ['tasks', { ...preparedFilters, page, pageSize }]);
  const { 
    data: tasksData, 
    isLoading, 
    error,
    isFetching,
    status: queryStatus
  } = useQuery<TaskListResponse, Error>({
    queryKey: ['tasks', { ...preparedFilters, page, pageSize }],
    queryFn: () => {
      console.log('Executing queryFn for tasks');
      return fetchTasks(preparedFilters, page, pageSize);
    },
    // Ensure we always refetch when the component mounts
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 1,
    // This will show loading state on initial load
    placeholderData: emptyTaskListResponse,
    // Force a refetch even if we think the data is fresh
    staleTime: 0,
    // Ensure we don't cache the empty response
    gcTime: 0
  });
  
  // Debug query status
  console.log('Query status:', queryStatus);
  console.log('isLoading:', isLoading);
  console.log('isFetching:', isFetching);
  console.log('Error:', error);
  console.log('Tasks data:', tasksData);

  // Ensure we have valid data
  const safeTasksData = useMemo(() => {
    // If we have no data yet, return the empty response
    if (!tasksData) {
      console.log('No tasks data yet, using empty response');
      return emptyTaskListResponse;
    }
    
    console.log('Raw tasks data:', tasksData);
    
    // Handle the response format from our API
    if (tasksData && typeof tasksData === 'object' && 'data' in tasksData) {
      const { data, total, page, limit, totalPages } = tasksData;
      return {
        data: Array.isArray(data) ? data : [],
        total: total || 0,
        page: page || 1,
        limit: limit || (Array.isArray(data) ? data.length : 0),
        totalPages: totalPages || 1
      };
    }
    
    // Fallback for unexpected response format
    console.warn('Unexpected tasks data format:', tasksData);
    return emptyTaskListResponse;
  }, [tasksData]);
  
  // Log the processed data for debugging
  useEffect(() => {
    console.log('Processed tasks data:', safeTasksData);
  }, [safeTasksData]);
  
  // Show error message if there's an error
  useEffect(() => {
    if (error) {
      console.error('Error fetching tasks:', error);
      // Using Ant Design's message component to show the error
      message.error('Failed to load tasks. Please try again later.');
    }
  }, [error]);
  
  // Define table columns
  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: any) => (
        <Link to={`/tasks/${record.id}`}>
          {text}
        </Link>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusOption = statusOptions.find(opt => opt.value === status);
        return statusOption ? (
          <Tag color={statusOption.color}>
            {statusOption.label}
          </Tag>
        ) : status;
      },
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => {
        const priorityOption = priorityOptions.find(opt => opt.value === priority);
        return (
          <Tag color={priorityOption?.color}>
            {priorityOption?.label || priority}
          </Tag>
        );
      },
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date: string) => date ? dayjs(date).format('MMM D, YYYY') : '-',
    },
    {
      title: 'Assignee',
      dataIndex: 'assignee',
      key: 'assignee',
      render: (assignee: UserRef) => (
        <Text>{assignee?.name || assignee?.email || 'Unassigned'}</Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: TaskType) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleEdit(record);
            }}
            title="Edit task"
          />
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleDeleteClick(record.id);
            }}
            loading={deleteMutation.isPending && taskToDelete === record.id}
            title="Delete task"
          />
        </Space>
      ),
    },
  ];
  
  const handleEdit = (task: TaskType) => {
    setSelectedTask(task);
    setIsDrawerOpen(true);
  };

const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setSelectedTask(null);
  };

  const handleTaskSubmitSuccess = () => {
    setIsDrawerOpen(false);
    setSelectedTask(null);
    queryClient.invalidateQueries({ queryKey: ['tasks', searchParams.toString()] });
  };

  // Handle delete confirmation
  const handleDeleteClick = (taskId: number) => {
    setTaskToDelete(taskId);
    setDeleteModalVisible(true);
  };

  // Delete task mutation
  const deleteMutation = useMutation({
    mutationFn: (taskId: number) => {
      return api.delete(`/v1/tasks/${taskId}`);
    },
    onSuccess: () => {
      message.success('Task deleted successfully');
      // Invalidate all task queries to force refetch
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error: any) => {
      console.error('Error deleting task:', error);
      message.error(error?.response?.data?.message || 'Failed to delete task');
    },
    onSettled: () => {
      setDeleteModalVisible(false);
      setTaskToDelete(null);
    }
  });

  // Handle confirm delete
  const confirmDelete = () => {
    if (taskToDelete) {
      deleteMutation.mutate(taskToDelete);
    }
  };

  // Handle cancel delete
  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setTaskToDelete(null);
  };

  // Handle table pagination changes
  const handleTableChange = (pagination: any) => {
    const params = new URLSearchParams(searchParams);
    // Convert to 0-based page index for the API
    params.set('page', String(pagination.current - 1));
    params.set('limit', String(pagination.pageSize));
    setSearchParams(params);
  };

  return (
    <div className="task-list">
      <Drawer
        title={selectedTask ? 'Edit Task' : 'Create New Task'}
        width={720}
        onClose={handleDrawerClose}
        open={isDrawerOpen}
        destroyOnClose
        styles={{
          body: {
            paddingBottom: 80,
          },
        }}
      >
        <TaskForm 
          task={selectedTask || undefined}
          projectId={initialFilters.projectId}
          onSuccess={handleTaskSubmitSuccess}
          onCancel={handleDrawerClose}
        />
      </Drawer>
      <Card title="Tasks">
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button 
              icon={<FilterOutlined />} 
              onClick={() => setFiltersVisible(!filtersVisible)}
            >
              {filtersVisible ? 'Hide Filters' : 'Show Filters'}
            </Button>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => window.location.reload()}
              loading={isFetching}
            >
              Refresh
            </Button>
          </Space>
        </div>
        
        {filtersVisible && (
          <Card 
            type="inner" 
            title="Filters" 
            style={{ marginBottom: 16 }}
            extra={
              <Button 
                type="link" 
                size="small" 
                onClick={handleResetFilters}
              >
                Clear Filters
              </Button>
            }
          >
            <Form form={form} onFinish={handleFilterSubmit}>
              <Row gutter={16}>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item name="search" label="Search">
                    <Input 
                      placeholder="Search tasks..." 
                      prefix={<SearchOutlined />} 
                      allowClear
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item name="status" label="Status">
                    <Select
                      mode="multiple"
                      placeholder="Select status"
                      options={statusOptions}
                      allowClear
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item name="priority" label="Priority">
                    <Select
                      mode="multiple"
                      placeholder="Select priority"
                      options={priorityOptions}
                      allowClear
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item name="projectId" label="Project">
                    <Select
                      placeholder={isLoadingProjects ? 'Loading projects...' : 'Select project'}
                      options={projectOptions}
                      loading={isLoadingProjects}
                      showSearch
                      optionFilterProp="label"
                      filterOption={(input, option) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                      notFoundContent={isLoadingProjects ? 'Loading...' : 'No projects found'}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item name="assigneeId" label="Assignee">
                    <Select
                      mode="multiple"
                      placeholder={isLoadingUsers ? 'Loading assignees...' : 'Select assignee(s)'}
                      options={assigneeOptions}
                      loading={isLoadingUsers}
                      showSearch
                      optionFilterProp="label"
                      filterOption={(input, option) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                      notFoundContent={isLoadingUsers ? 'Loading...' : 'No assignees found'}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item name="dateRange" label="Due Date Range">
                    <RangePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              <div style={{ textAlign: 'right' }}>
                <Button type="primary" htmlType="submit" loading={isFetching}>
                  Apply Filters
                </Button>
              </div>
            </Form>
          </Card>
        )}
      
      <Table
        dataSource={safeTasksData.data}
        columns={columns}
        rowKey="id"
        loading={isLoading || isFetching}
        pagination={{
          // Convert 0-based page from API to 1-based for Ant Design
          current: safeTasksData.page + 1,
          pageSize: safeTasksData.limit,
          total: safeTasksData.total,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} tasks`,
        }}
        onChange={handleTableChange}
        locale={{
          emptyText: (
            <div style={{ padding: '24px' }}>
              <Text type="secondary">
                No tasks found. Please try adjusting your filters or refreshing the page.
              </Text>
            </div>
          ),
        }}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        title="Delete Task"
        open={deleteModalVisible}
        onOk={confirmDelete}
        onCancel={cancelDelete}
        confirmLoading={deleteMutation.isPending}
      >
        <p>Are you sure you want to delete this task? This action cannot be undone.</p>
      </Modal>
    </Card>
  </div>
  );
};

export default TaskList;
