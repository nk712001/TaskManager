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
