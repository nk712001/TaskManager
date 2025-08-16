import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Form, Input, Alert, Select } from 'antd';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchUsers } from '../../api/users';
import type { User } from '../../api/users';

const projectSchema = z.object({
  name: z.string()
    .min(1, { message: 'Project name is required' })
    .max(100, { message: 'Project name must be less than 100 characters' }),
  description: z.string()
    .min(1, { message: 'Description is required' })
    .max(500, { message: 'Description must be less than 500 characters' }),
  owner: z.object({
    id: z.string().min(1, { message: 'Please select an owner' })
  })
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export type ProjectFormInputs = ProjectFormValues;

interface ProjectFormProps {
  initialValues?: Partial<ProjectFormInputs>;
  onSubmit: (values: ProjectFormInputs) => void;
  loading?: boolean;
  error?: string | null;
  ownerUser?: User;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ initialValues, onSubmit, loading, error, ownerUser }) => {
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: fetchUsers
  });

  const isSingleUser = users.length === 1;
  const singleUserId = isSingleUser ? String(users[0].id) : '';

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      description: '',
      owner: { id: '' }
    }
  });

  const { control, handleSubmit, formState: { errors }, reset, getValues } = form;

  // Debug log initial props
  console.log('ProjectForm render - initialValues:', initialValues);
  console.log('ProjectForm render - ownerUser:', ownerUser);

  // Update form when initialValues changes
  useEffect(() => {
    console.log('useEffect - initialValues changed:', initialValues);
    if (initialValues) {
      const values = {
        name: initialValues.name,
        description: initialValues.description || '',
        owner: { id: String(initialValues.owner?.id || '') }
      };
      console.log('Setting form values:', values);
      reset(values);
      console.log('Form values after reset:', getValues());
    } else if (isSingleUser && singleUserId) {
      reset({
        name: '',
        description: '',
        owner: { id: singleUserId }
      });
    } else if (ownerUser) {
      reset({
        name: '',
        description: '',
        owner: { id: String(ownerUser.id) }
      });
    } else {
      reset({
        name: '',
        description: '',
        owner: { id: '' }
      });
    }
  }, [initialValues, isSingleUser, singleUserId, ownerUser, reset]);

  const userOptions = useMemo(() => {
    // Create a map to ensure unique users by ID
    const userMap = new Map<string, { value: string; label: string }>();

    // Add users from the users list
    users.forEach(user => {
      userMap.set(String(user.id), {
        value: String(user.id),
        label: `${user.username || 'Unknown'} (${user.email || 'No email'})`
      });
    });

    // Add the ownerUser if provided and not already in the map
    if (ownerUser) {
      const ownerId = String(ownerUser.id);
      if (!userMap.has(ownerId)) {
        userMap.set(ownerId, {
          value: ownerId,
          label: `${ownerUser.username || 'Unknown'} (${ownerUser.email || 'No email'})`
        });
      }
    }

    // Convert the map values to an array
    return Array.from(userMap.values());
  }, [users, ownerUser]);

  const handleFormSubmit = useCallback((data: ProjectFormValues) => {
    const ownerId = data.owner?.id || (isSingleUser ? singleUserId : '');
    if (!ownerId) {
      console.error('No owner selected');
      return;
    }

    const submitData: ProjectFormInputs = {
      ...data,
      owner: { 
        id: String(ownerId)
      },
    };

    onSubmit(submitData);
  }, [isSingleUser, singleUserId, onSubmit]);

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
          render={({ field }) => <Input.TextArea {...field} rows={4} />}
        />
      </Form.Item>
      <Form.Item
        label="Owner"
        validateStatus={errors.owner?.id ? 'error' : ''}
        help={errors.owner?.id?.message}
      >
        <Controller
          name="owner"
          control={control}
          render={({ field }) => {
            // Get the current owner ID from the field value
            const ownerId = field.value?.id ? String(field.value.id) : '';
            
            return (
              <Select
                value={ownerId}
                onChange={(newValue) => {
                  // Update the form value with the new owner ID
                  field.onChange({ id: newValue });
                }}
                showSearch
                placeholder="Select owner"
                optionFilterProp="label"
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={userOptions}
                disabled={isSingleUser}
                style={{ width: '100%' }}
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
