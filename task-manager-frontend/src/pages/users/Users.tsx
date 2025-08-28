import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Button, 
  Space, 
  Typography, 
  Input,
  Avatar,
  Form,
  message,
  Popconfirm,
  Tag,
  Tooltip,
  Card,
  Table,
  Modal
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined 
} from '@ant-design/icons';
import { 
  fetchUsers, 
  createUser, 
  updateUser, 
  deleteUser, 
  type User, 
  type CreateUserData,
  type UpdateUserData,
  type Role,
  type UserRole
} from '../../api/users';
import UserForm from '../../components/users/UserForm';

const { Title } = Typography;
const { Search } = Input;

const Users: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  // Fetch users
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      message.success('User created successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsModalVisible(false);
      form.resetFields();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to create user');
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserData }) => updateUser(id, data),
    onSuccess: () => {
      message.success('User updated successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsModalVisible(false);
      form.resetFields();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to update user');
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      message.success('User deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      if (error.response?.data?.message?.includes('foreign key constraint')) {
        message.error('Cannot delete user: This user is assigned to one or more tasks. Please reassign or delete those tasks first.');
      } else {
        message.error(error.response?.data?.message || 'Failed to delete user');
      }
    },
  });

  const isSubmitting = createUserMutation.isPending || updateUserMutation.isPending;

  // Filter users based on search
  const filteredUsers = users.filter(user => {
    if (!searchText) return true;
    const usernameOrEmail = (user.username || user.email || '').toLowerCase();
    return usernameOrEmail.includes(searchText.toLowerCase());
  });

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const showCreateModal = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    // Reset form first to clear any previous state
    form.resetFields();
    
    // Set form values with a small delay to ensure form is ready
    setTimeout(() => {
      form.setFieldsValue({
        id: user.id,
        username: user.username || user.email || '',
        email: user.email || '',
        roles: user.roles || ['user']
      });
    }, 100);
    
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleSubmit = async (values: CreateUserData | UpdateUserData) => {
    try {
      if (editingUser) {
        // For updates, only include changed fields
        const updateData: Partial<UpdateUserData> = {};
        
        // Check which fields were actually changed
        if (values.username && values.username !== editingUser.username) {
          updateData.username = values.username;
        }
        if (values.email && values.email !== editingUser.email) {
          updateData.email = values.email;
        }
        if (values.password) {
          updateData.password = values.password;
        }
        
        // Handle roles if they were changed
        if (values.roles) {
          const currentRoles = editingUser.roles || [];
          const newRoles = Array.isArray(values.roles) ? values.roles : [values.roles];
          
          // Convert all roles to strings for comparison
          const toString = (role: string | Role | { name: string }): string => {
            if (!role) return '';
            if (typeof role === 'string') return role.toLowerCase();
            return (role as any).name?.toLowerCase?.() || '';
          };
          
          const newRoleStrings = newRoles.map(toString).filter(Boolean);
          const currentRoleStrings = currentRoles.map(toString).filter(Boolean);
          
          // Check if roles were actually changed
          const rolesChanged = 
            newRoleStrings.length !== currentRoleStrings.length ||
            !newRoleStrings.every(role => currentRoleStrings.includes(role));
            
          if (rolesChanged) {
            updateData.roles = newRoleStrings as UserRole[];
          }
        }
        
        // Only proceed with the update if there are changes
        if (Object.keys(updateData).length > 0) {
          await updateUserMutation.mutateAsync({
            id: editingUser.id,
            data: updateData
          });
        } else {
          message.info('No changes detected');
          setIsModalVisible(false);
        }
      } else {
        // Create new user - ensure all required fields are present
        const roles = values.roles || [];
        const toString = (role: string | Role | { name: string }): string => {
          if (!role) return '';
          if (typeof role === 'string') return role.toLowerCase();
          return (role as any).name?.toLowerCase?.() || '';
        };
        
        const userRoles = (Array.isArray(roles) ? roles : [roles])
          .map(toString)
          .filter(Boolean) as UserRole[];
          
        const createData: CreateUserData = {
          username: values.username!,
          email: values.email!,
          password: values.password!,
          roles: userRoles.length > 0 ? userRoles : ['user']
        };
        
        await createUserMutation.mutateAsync(createData);
      }
    } catch (error) {
      // Error handling is done in the mutation callbacks
      console.error('Error saving user:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteUserMutation.mutateAsync(id);
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'red';
      case 'manager': return 'blue';
      default: return 'green';
    }
  };

  // Define the base columns with proper typing
  const baseColumns: Array<{
    title: string;
    key: string;
    render?: (text: any, record: User) => React.ReactNode;
    width?: number;
  }> = [
    {
      title: 'User',
      key: 'user',
      width: 250,
      render: (_: any, record: User) => (
        <Space>
          <Avatar>{record.username?.charAt(0).toUpperCase() || 'U'}</Avatar>
          <div>
            <div>{record.username}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Roles',
      key: 'roles',
      width: 200,
      render: (_: any, record: User) => (
        <Space size="small">
          {record.roles?.map(role => (
            <Tag 
              key={role} 
              color={getRoleColor(role)}
              style={{ textTransform: 'capitalize' }}
            >
              {role}
            </Tag>
          )) || '-'}
        </Space>
      ),
    },

  ];

  // Add actions column only for admin users
  if (isAdmin) {
    baseColumns.push({
      title: 'Actions',
      key: 'actions',
      width: 200 as const,
      render: (_: any, record: User) => (
        <Space size="middle">
          <Tooltip title="Edit User">
            <Button 
              icon={<EditOutlined />} 
              size="small"
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          {!record.roles?.includes('admin') && (
            <Tooltip title="Delete User">
              <Popconfirm
                title="Delete User"
                description="Are you sure you want to delete this user?"
                onConfirm={() => handleDelete(record.id)}
                okText="Yes"
                cancelText="No"
                icon={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
              >
                <Button 
                  danger
                  icon={<DeleteOutlined />} 
                  size="small"
                />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      ),
    });
  }

  const columns = baseColumns;

  return (
    <div className="users-page">
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>User Management</Title>
        <p>Manage system users and their permissions</p>
      </div>

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <Search
              placeholder="Search by username or email..."
              allowClear
              enterButton={<SearchOutlined />}
              onSearch={handleSearch}
              style={{ width: 300, marginRight: 16 }}
            />
          </div>
          {isAdmin && (
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={showCreateModal}
            >
              Add User
            </Button>
          )}
        </div>

        <Table 
          columns={columns} 
          dataSource={filteredUsers} 
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingUser ? 'Edit User' : 'Create New User'}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={600}
        destroyOnClose
      >
        <UserForm
          form={form}
          onFinish={handleSubmit}
          isSubmitting={isSubmitting}
          isEditing={!!editingUser}
        />
      </Modal>
    </div>
  );
};

export default Users;
