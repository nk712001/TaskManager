import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Button, Form, Input, Alert, Card } from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const registerSchema = z
  .object({
    username: z.string().min(3, { message: 'Username must be at least 3 characters' }),
    password: z
      .string()
      .min(6, { message: 'Password must be at least 6 characters' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormInputs = z.infer<typeof registerSchema>;

export default function Register() {
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const {

    handleSubmit,
    formState: { errors },
    control,
  } = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: RegisterFormInputs) => {
    setFormError(null);
    setIsLoading(true);
    try {
      await axios.post('/api/auth/register', {
        username: data.username,
        password: data.password,
      });
      navigate('/login');
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        minWidth: '100vw',
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      }}
    >
      <div style={{ width: '100%', maxWidth: 380, padding: '0 16px' }}>
        <Card
          bordered={false}
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.07)', borderRadius: 12 }}
          bodyStyle={{ padding: '2rem 2rem 1.5rem 2rem' }}
        >
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            {/* Logo Placeholder */}
            <div style={{ marginBottom: 8 }}>
              <img
                src="/vite.svg"
                alt="TaskManager Logo"
                style={{ width: 48, height: 48, marginBottom: 4 }}
              />
            </div>
            <h2 style={{ margin: 0, fontWeight: 700, fontSize: 24 }}>
              Create your TaskManager account
            </h2>
            <p style={{ color: '#888', margin: '8px 0 0 0', fontSize: 14 }}>
              Enter your details to sign up
            </p>
          </div>
          <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
            <Form.Item
              label="Username or Email"
              validateStatus={errors.username ? 'error' : ''}
              help={errors.username?.message}
            >
              <Controller
                name="username"
                control={control}
                defaultValue=""
                render={({ field }) => <Input {...field} autoComplete="username" />}
              />
            </Form.Item>
            <Form.Item
              label="Password"
              validateStatus={errors.password ? 'error' : ''}
              help={errors.password?.message}
            >
              <Controller
                name="password"
                control={control}
                defaultValue=""
                render={({ field }) => <Input.Password {...field} autoComplete="new-password" />}
              />
            </Form.Item>
            <Form.Item
              label="Confirm Password"
              validateStatus={errors.confirmPassword ? 'error' : ''}
              help={errors.confirmPassword?.message}
            >
              <Controller
                name="confirmPassword"
                control={control}
                defaultValue=""
                render={({ field }) => <Input.Password {...field} autoComplete="new-password" />}
              />
            </Form.Item>
            {formError && (
              <Alert
                message={formError}
                type="error"
                showIcon
                style={{ marginBottom: 12 }}
              />
            )}
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={isLoading}
                disabled={isLoading}
                style={{ fontWeight: 600, height: 40 }}
              >
                Sign Up
              </Button>
            </Form.Item>
            <div style={{ textAlign: 'center', fontSize: 14 }}>
              Already have an account?{' '}
              <a href="/login" style={{ color: '#1677ff' }}>
                Sign in
              </a>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
}
