import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Form, Input, Alert } from 'antd';
import React from 'react';

const projectSchema = z.object({
  name: z.string()
    .min(1, { message: 'Project name is required' })
    .max(100, { message: 'Project name must be less than 100 characters' }),
  description: z.string()
    .min(1, { message: 'Description is required' })
    .max(500, { message: 'Description must be less than 500 characters' }),
  ownerId:  z.preprocess(
    (val) => String(val), // 👈 Force everything into a string
    z.string()
      .min(1, { message: 'Please select an owner' })
      .refine(val => val !== 'undefined' && val !== 'null', {
        message: 'Please select a valid owner'
      })
  ),  
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
  ownerUser?: User;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ initialValues, onSubmit, loading, error, ownerUser }) => {
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: fetchUsers
  });

  // Check if there's only one user
  const isSingleUser = users.length === 1;

  // Get the single user's ID as a string if only one user exists
  const singleUserId = isSingleUser ? String(users[0].id) : '';

  // Convert any value to string for the form
  // const toFormValue = (value: unknown): string => {
  //   if (value === undefined || value === null) return '';
  //   return String(value);
  // };

  // Convert form value to the expected type for submission
  const toSubmitValue = (value: unknown): string => {
    if (value === undefined || value === null) return '';
    return String(value);
  };

  // Handle form submission with proper type safety
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProjectFormInputs>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      description: '',
      ownerId: '',
      ...initialValues
    },
  });

  // Handle form submission
  const handleFormSubmit = (data: Record<string, any>) => {
    const formData = data as ProjectFormInputs;
    // Ensure ownerId is properly handled before submission
    const ownerId = toSubmitValue(formData.ownerId || (isSingleUser ? singleUserId : ''));
    if (!ownerId) {
      console.error('No owner selected');
      return;
    }

    // Create form data with properly typed values
    const submitData: ProjectFormInputs = {
      ...formData,
      ownerId: ownerId,
    };

    onSubmit(submitData);
  };

  React.useEffect(() => {
    // Fix: Only reset to known fields (ownerId, not owner)
    reset(initialValues || { name: '', description: '', ownerId: '' });
  }, [initialValues, reset]);

  return (
    <Form layout="vertical" onFinish={handleSubmit((data) => handleFormSubmit(data))}>
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
          render={({ field }) => {
            const value = field.value !== undefined && field.value !== null ? String(field.value) : undefined;

            return usersLoading ? <Spin /> : (
              <Select
                value={isSingleUser ? singleUserId : String(field.value || '')}
                onChange={(value) => {
                  field.onChange(String(value)); // ✅ Ensure string
                }}
                showSearch
                placeholder="Select owner"
                optionFilterProp="children"
                disabled={isSingleUser}
                filterOption={(input, option) =>
                  (option?.label as string).toLowerCase().includes(input.toLowerCase())
                }
                options={(() => {
                  const options = users?.map(user => ({
                    value: String(user.id), // ✅ stringified here
                    label: `${user.username || 'Unknown'} (${user.email || 'No email'})`
                  })) || [];

                  if (ownerUser) {
                    const ownerExists = options.some(opt => opt.value === String(ownerUser.id));
                    if (!ownerExists) {
                      options.unshift({
                        value: String(ownerUser.id),
                        label: `${ownerUser.username || 'Unknown'} ${ownerUser.email ? `(${ownerUser.email})` : ''}`
                      });
                    }
                  }
                  return options;
                })()}
              />    
            );
          }}
        />
      </Form.Item>
      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}
      <Form.Item>
        {isSingleUser && (
          <div style={{ marginBottom: 16, color: 'rgba(0, 0, 0, 0.45)' }}>
            Only one user available. Owner selection is disabled.
          </div>
        )}
        <Button type="primary" htmlType="submit" loading={loading} block>
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
};

export default ProjectForm;
