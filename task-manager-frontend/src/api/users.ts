import api from './axios';

export interface User {
  id: string;
  username: string;
  email: string;
  status?: 'active' | 'inactive';
}

export const fetchUsers = async (): Promise<User[]> => {
  const { data } = await api.get('/v1/users');
  return data;
};

export const fetchUserById = async (id: string | number): Promise<User> => {
  const { data } = await api.get(`/v1/users/${id}`);
  return data;
};

export interface UserListResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const fetchUsersForDropdown = async (): Promise<{value: string; label: string}[]> => {
  const response = await api.get<UserListResponse>('/v1/users', {
    params: {
      page: 1,
      limit: 100,
      sort: 'username',
    },
  });
  
  return response.data.data.map(user => ({
    value: user.id,
    label: user.username || user.email,
  }));
};

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  status?: 'active' | 'inactive';
}

export const createUser = async (userData: CreateUserData): Promise<User> => {
  const { data } = await api.post<User>('/v1/users', userData);
  return data;
};

export interface UpdateUserData {
  username?: string;
  email?: string;
  status?: 'active' | 'inactive';
  password?: string;
}

export const updateUser = async (id: string, userData: UpdateUserData): Promise<User> => {
  const { data } = await api.patch<User>(`/v1/users/${id}`, userData);
  return data;
};

export const deleteUser = async (id: string): Promise<void> => {
  await api.delete(`/v1/users/${id}`);
};
