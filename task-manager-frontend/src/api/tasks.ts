import api from './axios';
import { fetchUserById } from './users';

export interface UserRef {
  id: number;
  email: string;
  name?: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate?: string;
  projectId: number;
  assigneeId?: number | null;
  assignee?: UserRef;
  creatorId: number;
  creator?: UserRef;
  createdAt: string;
  updatedAt: string;
}

export interface TaskFilters {
  status?: string[];
  priority?: string[];
  assigneeId?: string[];
  projectId?: string;
  search?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
}

export interface TaskListResponse {
  data: Task[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Default empty response
const emptyTaskListResponse: TaskListResponse = {
  data: [],
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
};

export { emptyTaskListResponse };

export const fetchTasks = async (filters: TaskFilters = {}, page = 1, limit = 100): Promise<TaskListResponse> => {
  console.log('=== fetchTasks called with ===');
  console.log('Filters:', filters);
  console.log('Page:', page, 'Limit:', limit);
  
  try {
    // Prepare query parameters
    const params: Record<string, string> = {
      page: page.toString(),
      size: limit.toString()
    };

    // Add optional filters
    if (filters.status?.length) params.status = filters.status.join(',');
    if (filters.priority?.length) params.priority = filters.priority.join(',');
    if (filters.assigneeId?.length) params.assigneeId = filters.assigneeId[0];
    if (filters.projectId) params.projectId = filters.projectId;
    if (filters.search) params.search = filters.search;
    if (filters.dueDateFrom) params.dueDateFrom = filters.dueDateFrom;
    if (filters.dueDateTo) params.dueDateTo = filters.dueDateTo;

    console.log('Making API call to /v1/tasks with params:', params);
    const response = await api.get('/v1/tasks', { params });
    
    console.log('API Response:', {
      status: response.status,
      data: response.data,
      headers: response.headers
    });
    
    // Handle the response data
    const responseData = response.data;
    
    // If we get a total > 0 but empty data array, log a warning
    if (responseData && responseData.total > 0 && 
        (!responseData.data || responseData.data.length === 0)) {
      console.warn('API returned total > 0 but empty data array. This might indicate a backend issue.');
      return emptyTaskListResponse;
    }
    
    // If we have data, fetch assignee details for each task
    if (responseData?.data?.length > 0) {
      const tasksWithAssignees = await Promise.all(
        responseData.data.map(async (task: any) => {
          if (!task.assigneeId) return task;
          
          try {
            const assignee = await fetchUserById(task.assigneeId);
            return {
              ...task,
              assignee: {
                id: assignee.id,
                name: assignee.username || assignee.email,
                email: assignee.email
              }
            };
          } catch (error) {
            console.error(`Error fetching assignee ${task.assigneeId} for task ${task.id}:`, error);
            return task; // Return the task as-is if we can't fetch assignee
          }
        })
      );
      
      return {
        ...responseData,
        data: tasksWithAssignees
      };
    }
    
    // Return the response as-is if we don't need to process it further
    return responseData || emptyTaskListResponse;
    
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return emptyTaskListResponse;
  }
};

export const fetchTaskById = async (id: string): Promise<Task> => {
  const response = await api.get<Task>(`/v1/tasks/${id}`);
  return response.data;
};

export const createTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'creator' | 'assignee'>): Promise<Task> => {
  const response = await api.post<Task>('/v1/tasks', taskData);
  return response.data;
};

export const updateTask = async (id: string, taskData: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'creator' | 'assignee'>>): Promise<Task> => {
  const response = await api.put<Task>(`/v1/tasks/${id}`, taskData);
  return response.data;
};

export const deleteTask = async (id: string): Promise<void> => {
  await api.delete(`/v1/tasks/${id}`);
};

export const updateTaskStatus = async (id: string, status: Task['status']): Promise<Task> => {
  const { data } = await api.patch(`/v1/tasks/${id}/status`, { status });
  return data;
};

export const assignTask = async (taskId: string, userId: string): Promise<Task> => {
  const { data } = await api.patch(`/v1/tasks/${taskId}/assign`, { userId });
  return data;
};
