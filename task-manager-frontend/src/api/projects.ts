import api from './axios';

export interface Project {
  id: string;
  name: string;
  description: string;
  owner: string;
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

export const createProject = async (project: Omit<Project, 'id' | 'createdAt'>): Promise<Project> => {
  const { data } = await api.post('/v1/projects', project);
  return data;
};

export const updateProject = async (id: string, project: Partial<Omit<Project, 'id' | 'createdAt'>>): Promise<Project> => {
  const { data } = await api.put(`/v1/projects/${id}`, project);
  return data;
};

export const deleteProject = async (id: string): Promise<void> => {
  await api.delete(`/v1/projects/${id}`);
};
