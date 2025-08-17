import api from './axios';

export interface User {
  id: string;
  username: string;
  email: string;
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
