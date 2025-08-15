import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';
import { Button, Checkbox, Form, Input, Alert, Card } from 'antd';

const loginSchema = z.object({
  identifier: z.string().min(3, { message: 'Enter a valid username or email' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  remember: z.boolean().optional(),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

export default function Login() {
  const { login, isLoading, error } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const {

    handleSubmit,
    formState: { errors },
    control,
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
    defaultValues: { remember: false },
  });

  const onSubmit = async (data: LoginFormInputs) => {
    setFormError(null);
    try {
      const identifier = typeof data.identifier === 'string' ? data.identifier : '';
      const password = typeof data.password === 'string' ? data.password : '';
      
      console.log('Attempting login...');
      await login(identifier, password, !!data.remember);
      
      // Give the state a moment to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check both storage locations for auth data
      let authData = localStorage.getItem('taskmanager_auth') || 
                    sessionStorage.getItem('taskmanager_auth');
      
      console.log('Stored auth data after login:', authData);
      
      if (!authData) {
        throw new Error('Authentication data not found in storage');
      }
      
      // Parse the auth data to verify tokens
      try {
        const parsedAuth = JSON.parse(authData);
        if (!parsedAuth?.tokens?.accessToken) {
          throw new Error('No access token found in stored auth data');
        }
        console.log('Login successful, redirecting to dashboard');
        window.location.href = '/dashboard';
      } catch (parseError) {
        console.error('Error parsing auth data:', parseError);
        throw new Error('Failed to process authentication data');
      }
    } catch (err: any) {
      setFormError(err.message || 'Login failed');
    }
  };


  return (
    <div style={{
      minHeight: '100vh',
      minWidth: '100vw',
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    }}>
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
            <h2 style={{ margin: 0, fontWeight: 700, fontSize: 24 }}>Sign in to TaskManager</h2>
            <p style={{ color: '#888', margin: '8px 0 0 0', fontSize: 14 }}>
              Enter your credentials to continue
            </p>
          </div>
          <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
            <Form.Item label="Username or Email" validateStatus={errors.identifier ? 'error' : ''} help={errors.identifier?.message}>
              <Controller
                name="identifier"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <Input
                    {...field}
                    autoComplete="username"
                    size="large"
                    placeholder="Enter your username or email"
                  />
                )}
              />
            </Form.Item>
            <Form.Item label="Password" validateStatus={errors.password ? 'error' : ''} help={errors.password?.message}>
              <Controller
                name="password"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <Input.Password
                    {...field}
                    autoComplete="current-password"
                    size="large"
                    placeholder="Enter your password"
                  />
                )}
              />
            </Form.Item>
            <Form.Item style={{ marginBottom: 8 }}>
              <Controller
                name="remember"
                control={control}
                defaultValue={false}
                render={({ field }: { field: any }) => (
                  <Checkbox
                    checked={!!field.value}
                    onChange={e => field.onChange(e.target.checked)}
                  >
                    Remember Me
                  </Checkbox>
                )}
              />
              <a href="#" style={{ float: 'right', fontSize: 13 }}>Forgot Password?</a>
            </Form.Item>
            {formError || error ? (
              <Alert type="error" message={formError || error} showIcon style={{ marginBottom: 16 }} />
            ) : null}
            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" loading={isLoading} block size="large" style={{ fontWeight: 600 }}>
                Log In
              </Button>
            </Form.Item>
          </Form>
        </Card>
        <div style={{ textAlign: 'center', marginTop: 24, color: '#888', fontSize: 13 }}>
          © {new Date().getFullYear()} TaskManager. All rights reserved.
        </div>
      </div>
    </div>
  );
}
