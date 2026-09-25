import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import authService from '../services/auth.service.js';
import useAuthStore from '../store/auth.store.js';

export function useAuth() {
  const queryClient = useQueryClient();
  const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: ({ email, password }) => authService.login(email, password),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      queryClient.setQueryData(['me'], data.user);
    }
  });

  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
    }
  });

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: () => authService.getMe(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000
  });

  return {
    user: meQuery.data?.user || user,
    isAuthenticated,
    isLoading: meQuery.isLoading,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending
  };
}

export default useAuth;
