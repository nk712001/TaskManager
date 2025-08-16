import api from './axios';

export interface UserRef {
  id: number;
  email: string;
  name?: string;
}

export interface Project {
  id: string;  // Keep as string for frontend
  name: string;
  description: string;
  ownerName: string;
  ownerId: string;
  owner?: UserRef;
  tasks?: any[];  // Made optional with ?
  createdAt: string;
}

export const fetchProjects = async (): Promise<Project[]> => {
  const { data } = await api.get('/v1/projects');
  return data;
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
