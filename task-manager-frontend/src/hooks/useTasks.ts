import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTask as createTaskApi, updateTask as updateTaskApi } from '../api/tasks';
import { message } from 'antd';

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createTaskApi,
    onSuccess: () => {
      message.success('Task created successfully');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error: Error) => {
      console.error('Error creating task:', error);
      message.error(`Failed to create task: ${error.message}`);
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: any }) => 
      updateTaskApi(id, data),
    onSuccess: () => {
      message.success('Task updated successfully');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error: Error) => {
      console.error('Error updating task:', error);
      message.error(`Failed to update task: ${error.message}`);
    },
  });
};
