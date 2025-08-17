import React from 'react';
import { Form, Input, Button, message } from 'antd';
import type { FormInstance } from 'antd';
import type { CreateUserData } from '../../api/users';

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

      <Form.Item>
        <Button 
          type="primary" 
          htmlType="submit" 
          loading={isSubmitting}
        >
          Create User
        </Button>
        <Button onClick={() => form.resetFields()}>
          Reset
        </Button>
      </Form.Item>
    </Form>
  );
};

export default UserForm;
