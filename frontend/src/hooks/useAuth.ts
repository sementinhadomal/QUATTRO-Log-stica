import { useAuth as useZustandAuth } from '../stores/auth.store';

export const useAuth = () => {
  const store = useZustandAuth();
  return store;
};
