import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Table, 
  Button, 
  Space, 
  Modal, 
  Typography, 
  Card,
  Input,
  Avatar,
  Form,
  message,
  Popconfirm
} from 'antd';
import { PlusOutlined, SearchOutlined, ExclamationCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { 
  fetchUsers, 
  createUser, 
  updateUser, 
  deleteUser, 
  type User, 
  type CreateUserData,
  type UpdateUserData 
} from '../../api/users';
import UserForm from '../../components/users/UserForm';

const { Title } = Typography;
const { Search } = Input;

const Users: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

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
      message.error(error.response?.data?.message || 'Failed to delete user');
    },
  });

  const isSubmitting = createUserMutation.isPending || updateUserMutation.isPending;

  // Filter users based on search
  const filteredUsers = users.filter(user => {
    if (!searchText) return true; // Return all users if search is empty
    
    const search = searchText.toLowerCase();
    const usernameOrEmail = (user.username || user.email || '').toLowerCase();
    
    return usernameOrEmail.includes(search);
  });

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const showCreateModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleSubmit = async (values: CreateUserData | UpdateUserData) => {
    try {
      await createUserMutation.mutateAsync(values as CreateUserData);
    } catch (error) {
      // Error handling is done in the mutation callbacks
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteUserMutation.mutateAsync(id);
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const columns = [
    {
      title: 'Username / Email',
      key: 'user',
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
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: User) => (
        <Space size="middle">
          <Popconfirm
            title="Delete User"
            description="Are you sure you want to delete this user?"
            icon={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

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
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={showCreateModal}
          >
            Add User
          </Button>
        </div>

        <Table 
          columns={columns} 
          dataSource={filteredUsers} 
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* User Form Modal - Will be implemented in next step */}
      <Modal
        title="Create New User"
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
        />
      </Modal>
    </div>
  );
};

export default Users;
