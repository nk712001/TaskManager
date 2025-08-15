import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Form, Input, Alert } from 'antd';
import React from 'react';

const projectSchema = z.object({
  name: z.string().min(1, { message: 'Please enter project name' }),
  description: z.string().min(1, { message: 'Please enter description' }),
  ownerId: z.string().min(1, { message: 'Please select owner' }),
});

export type ProjectFormInputs = z.infer<typeof projectSchema>;
import type { User } from '../../api/users';
import { fetchUsers } from '../../api/users';
import { Select, Spin } from 'antd';
import { useQuery } from '@tanstack/react-query';

interface ProjectFormProps {
  initialValues?: Partial<ProjectFormInputs>;
  onSubmit: (values: ProjectFormInputs) => void;
  loading?: boolean;
  error?: string | null;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ initialValues, onSubmit, loading, error }) => {
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: fetchUsers
  });
  const {
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<ProjectFormInputs>({
    resolver: zodResolver(projectSchema),
    defaultValues: initialValues || { name: '', description: '', ownerId: '' },
  });

  React.useEffect(() => {
    // Fix: Only reset to known fields (ownerId, not owner)
    reset(initialValues || { name: '', description: '', ownerId: '' });
  }, [initialValues, reset]);

  return (
    <Form layout="vertical" onFinish={handleSubmit(onSubmit as any)}>
      <Form.Item
        label="Name"
        validateStatus={errors.name ? 'error' : ''}
        help={errors.name?.message}
      >
        <Controller
          name="name"
          control={control}
          render={({ field }) => <Input {...field} autoFocus />}
        />
      </Form.Item>
      <Form.Item
        label="Description"
        validateStatus={errors.description ? 'error' : ''}
        help={errors.description?.message}
      >
        <Controller
          name="description"
          control={control}
          render={({ field }) => <Input {...field} />}
        />
      </Form.Item>
      <Form.Item
        label="Owner"
        validateStatus={errors.ownerId ? 'error' : ''}
        help={errors.ownerId?.message}
      >
        <Controller
          name="ownerId"
          control={control}
          render={({ field }) => (
            usersLoading ? <Spin /> :
            <Select
              {...field}
              value={field.value ? String(field.value) : undefined}
              onChange={value => field.onChange(String(value))}
              showSearch
              placeholder="Select owner"
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label as string).toLowerCase().includes(input.toLowerCase())
              }
              options={users?.map(user => ({
                value: String(user.id),
                label: `${user.username} (${user.email})`
              }))}
            />
          )}
        />
      </Form.Item>
      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block>
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
};

export default ProjectForm;
