import api from './axios';

export type UserRole = 'admin' | 'user';

// Available roles in the system
export const AVAILABLE_ROLES = ['ADMIN', 'USER'] as const;
type BackendRole = typeof AVAILABLE_ROLES[number];

export type Role = {
  name: BackendRole;
};

// Helper function to convert role name to UserRole
export const toUserRole = (roleName: string): UserRole => {
  if (!roleName) return 'user';
  const role = roleName.replace('ROLE_', '').toLowerCase();
  return role === 'admin' ? 'admin' : 'user';
};

// Convert frontend UserRole to backend role string
export const toBackendRole = (role: UserRole): BackendRole => {
  return role.toUpperCase() as BackendRole;
};

// Convert backend role string to frontend UserRole
export const fromBackendRole = (role: string): UserRole => {
  return toUserRole(role);
};

export interface User {
  id: string;
  username: string;
  email: string;
  status?: 'active' | 'inactive';
  roles: UserRole[];
}

export const fetchUsers = async (): Promise<User[]> => {
  try {
    const { data } = await api.get('/v1/users');
    console.log('Fetched users:', data);
    
    if (!Array.isArray(data)) {
      console.error('Expected an array of users but got:', data);
      return [];
    }
    
    return data.map(user => ({
      ...user,
      // Convert role strings to UserRole type, default to 'user' if no roles
      roles: (user.roles?.map((r: string) => fromBackendRole(r)) || ['user'])
        .filter(Boolean) as UserRole[]
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export const fetchUserById = async (id: string | number): Promise<User> => {
  try {
    const { data } = await api.get(`/v1/users/${id}`);
    console.log('Fetched user by ID:', data);
    
    return {
      ...data,
      // Convert role strings to UserRole type, default to 'user' if no roles
      roles: (data.roles?.map((r: string) => fromBackendRole(r)) || ['user'])
        .filter(Boolean) as UserRole[]
    };
  } catch (error) {
    console.error(`Error fetching user ${id}:`, error);
    throw error;
  }
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
  roles: (UserRole | Role)[];
}

export const createUser = async (userData: CreateUserData): Promise<User> => {
  try {
    // Ensure at least one role is provided, default to 'user'
    const roles: UserRole[] = (userData.roles && userData.roles.length > 0) 
      ? userData.roles.flatMap(role => {
          // Handle both string and Role object formats
          if (typeof role === 'string' && ['admin', 'user'].includes(role)) {
            return [role];
          } else if (typeof role === 'object' && role.name) {
            const roleName = role.name.toLowerCase();
            return ['admin', 'user'].includes(roleName) ? [roleName as UserRole] : [];
          }
          return [];
        })
      : ['user'];
      
    // Transform to match backend's expected format
    const payload = {
      ...userData,
      roles: roles.map(role => ({
        name: toBackendRole(role) // This will convert to uppercase
      }))
    };
    
    console.log('Creating user with payload:', payload);
    const { data } = await api.post<User>('/v1/users', payload);
    return {
      ...data,
      roles: (data.roles?.map((r: any) => fromBackendRole(r.name || r)) || ['user']) as UserRole[]
    };
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export interface UpdateUserData {
  username?: string;
  email?: string;
  status?: 'active' | 'inactive';
  password?: string;
  roles?: (UserRole | Role)[];
}

export const updateUser = async (id: string, userData: Partial<UpdateUserData>): Promise<User> => {
  try {
    const payload: any = {};
    const { roles, ...restData } = userData;
    
    // Only include provided fields in the payload
    Object.entries(restData).forEach(([key, value]) => {
      if (value !== undefined) {
        payload[key] = value;
      }
    });
    
    // Handle roles if provided
    if (roles) {
      const rolesArray = Array.isArray(roles) ? roles : [roles];
      const userRoles: UserRole[] = [];
      
      rolesArray.forEach(role => {
        if (role === 'admin' || role === 'user') {
          userRoles.push(role);
        } else if (role && typeof role === 'object' && 'name' in role && role.name) {
          const roleName = typeof role.name === 'string' ? role.name.toLowerCase() : '';
          if (roleName === 'admin' || roleName === 'user') {
            userRoles.push(roleName as UserRole);
          }
        }
      });
      
      const finalRoles = userRoles.length > 0 ? userRoles : ['user'] as UserRole[];
      payload.roles = finalRoles.map(role => ({
        name: toBackendRole(role)
      }));
    }
    
    console.log('Updating user with PATCH payload:', payload);
    const { data } = await api.patch<User>(`/v1/users/${id}`, payload);
    
    return {
      ...data,
      roles: (data.roles?.map(r => fromBackendRole(r)) || ['user']) as UserRole[]
    };
  } catch (error) {
    console.error(`Error updating user ${id}:`, error);
    throw error;
  }
};

export const deleteUser = async (id: string): Promise<void> => {
  await api.delete(`/v1/users/${id}`);
};
