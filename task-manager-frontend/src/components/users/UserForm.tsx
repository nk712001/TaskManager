import React from 'react';
import { Form, Input, Button, message, Select, Tag, Tooltip } from 'antd';
import type { FormInstance } from 'antd';
import { UserOutlined, UserAddOutlined } from '@ant-design/icons';
import type { CreateUserData } from '../../api/users';

const { Option } = Select;

const ROLE_OPTIONS = [
  { value: 'admin' as const, label: 'Admin', color: 'red', description: 'Full access to all features' },
  { value: 'user' as const, label: 'Standard User', color: 'blue', description: 'Basic access with limited permissions' },
];

// Role display and selection components

interface UserFormProps {
  form: FormInstance;
  onFinish: (values: CreateUserData) => Promise<void>;
  isSubmitting: boolean;
}

const UserForm: React.FC<UserFormProps> = ({
  form,
  onFinish,
  isSubmitting,
}) => {
  const onFinishFailed = (errorInfo: any) => {
    console.log('Failed:', errorInfo);
    message.error('Please check the form for errors');
  };

  // Reset form when component mounts
  React.useEffect(() => {
    form.resetFields();
  }, [form]);

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
      initialValues={{ roles: ['user'] }}
    >
      <Form.Item
        name="username"
        label="Username or Email"
        rules={[
          { 
            required: true, 
            message: 'Please input a username or email' 
          },
          {
            min: 3,
            message: 'Must be at least 3 characters'
          },
          () => ({
            validator(_, value) {
              // Only validate email format if the input contains an @ symbol
              if (!value || !value.includes('@') || /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('Please enter a valid email (if using email format)'));
            },
          })
        ]}
      >
        <Input placeholder="Enter username or email" />
      </Form.Item>

      <Form.Item
        name="password"
        label="Password"
        rules={[
          { required: true, message: 'Please input a password' },
          { min: 6, message: 'Password must be at least 6 characters' },
        ]}
      >
        <Input.Password placeholder="Enter password" />
      </Form.Item>

      <Form.Item
        name="roles"
        label={
          <span>
            Roles 
            <Tooltip title="Select at least one role for the user">
              <span style={{ marginLeft: 8, color: '#8c8c8c' }}>
                <i className="fas fa-info-circle" />
              </span>
            </Tooltip>
          </span>
        }
        rules={[
          { 
            type: 'array',
            required: true,
            message: 'Please select at least one role',
            validator: (_, value) => 
              value && value.length > 0 ? Promise.resolve() : Promise.reject('At least one role is required')
          },
        ]}
      >
        <Select
          mode="multiple"
          showArrow
          style={{ width: '100%' }}
          placeholder="Select user roles"
          optionLabelProp="label"
          optionFilterProp="children"
          filterOption={(input, option) => {
            const label = option?.label?.toString() || '';
            return label.toLowerCase().includes(input.toLowerCase());
          }}
          tagRender={(props) => {
            const { label, value, closable, onClose } = props;
            return (
              <Tag 
                color={ROLE_OPTIONS.find(opt => opt.value === value)?.color}
                closable={closable}
                onClose={onClose}
                style={{ margin: '2px 4px' }}
              >
                {label}
              </Tag>
            );
          }}
        >
          {ROLE_OPTIONS.map(role => (
            <Option 
              key={role.value} 
              value={role.value} 
              label={role.label}
            >
              <Tooltip title={role.description} placement="right">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ marginRight: 8 }}>
                      {role.value === 'admin' ? <UserAddOutlined /> : <UserOutlined />}
                    </span>
                    {role.label}
                  </div>
                  <Tag color={role.color} style={{ marginLeft: 'auto' }}>
                    {role.value.toUpperCase()}
                  </Tag>
                </div>
              </Tooltip>
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item>
        <Button 
          type="primary" 
          htmlType="submit" 
          loading={isSubmitting}
          style={{ marginRight: 8 }}
        >
          {form.getFieldValue('id') ? 'Update User' : 'Create User'}
        </Button>
        <Button 
          onClick={() => form.resetFields()}
          disabled={isSubmitting}
        >
          Reset
        </Button>
      </Form.Item>
    </Form>
  );
};

export default UserForm;
