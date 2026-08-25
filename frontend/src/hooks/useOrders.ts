import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Order } from '../types';

export const useOrders = () => {
  const queryClient = useQueryClient();

  const getOrders = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data } = await api.get('/pedidos?kanban=true');
      return data as Order[];
    },
    enabled: false // Mocked for now, enable when API is ready
  });

  const createOrder = useMutation({
    mutationFn: async (newOrder: Partial<Order>) => {
      const { data } = await api.post('/pedidos', newOrder);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });

  return { getOrders, createOrder };
};
