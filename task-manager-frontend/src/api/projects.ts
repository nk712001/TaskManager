import api from './axios';

export interface UserRef {
  id: number;
  email: string;
  name?: string;
}

export interface Task {
  id: string;
  title: string;
  status: string;
  description?: string;
  dueDate?: string;
}

export interface Project {
  id: string;  // Keep as string for frontend
  name: string;
  description?: string;
  ownerId: string;
  ownerName?: string;
  tasks?: Task[];
  owner?: UserRef;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectListResponse {
  data: Project[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const fetchProjectsForDropdown = async (): Promise<{value: string; label: string}[]> => {
  try {
    console.log('Making API request to /v1/projects...');
    const response = await api.get<Project[] | PaginatedResponse<Project>>('/v1/projects');
    
    console.log('Projects API response:', {
      status: response.status,
      data: response.data,
      projectCount: Array.isArray(response.data) ? response.data.length : response.data?.data?.length || 0,
      headers: response.headers
    });
    
    if (!response.data) {
      console.error('No data in response:', response);
      return [];
    }
    
    // Handle both array and paginated response
    const projects = Array.isArray(response.data) 
      ? response.data 
      : 'data' in response.data ? response.data.data : [];
    
    if (!Array.isArray(projects)) {
      console.error('Expected array of projects but got:', projects);
      return [];
    }
    
    console.log('Processed projects:', projects.map(p => ({ id: p.id, name: p.name })));
    
    return projects.map(project => ({
      value: String(project.id),
      label: project.name,
    }));
  } catch (error: unknown) {
    console.error('Error in fetchProjectsForDropdown:', error);
    if (error && typeof error === 'object' && 'response' in error) {
      const apiError = error as {
        response?: {
          status?: number;
          data?: unknown;
          headers?: unknown;
        };
      };
      console.error('API Error Response:', {
        status: apiError.response?.status,
        data: apiError.response?.data,
        headers: apiError.response?.headers
      });
    }
    throw error; // Re-throw to be handled by the query
  }
};

export const fetchProjects = async (): Promise<Project[]> => {
  const { data } = await api.get('/v1/projects');
  if (Array.isArray(data)) {
    return data;
  }
  if (data && Array.isArray(data.data)) {
    return data.data;
  }
  return [];
};

export const fetchProjectById = async (id: string): Promise<Project> => {
  const { data } = await api.get(`/v1/projects/${id}`);
  return data;
};

export const createProject = async (project: { name: string; description: string; owner: { id: number }; tasks?: any[] }): Promise<Project> => {
  const { data } = await api.post('/v1/projects', project);
  return data;
};

export const updateProject = async (id: string, project: { name: string; description: string; owner: { id: number }; tasks?: any[] }): Promise<Project> => {
  const { data } = await api.put(`/v1/projects/${id}`, project);
  return data;
};

export const deleteProject = async (id: string): Promise<void> => {
  await api.delete(`/v1/projects/${id}`);
};
