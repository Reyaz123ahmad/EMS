import { useQuery } from '@tanstack/react-query';
import leaveService from '../services/leave.service.js';

export const useLeaveBalances = (year) => {
  const queryYear = year || new Date().getFullYear();
  return useQuery({
    queryKey: ['leave', 'balances', queryYear],
    queryFn: () => leaveService.getLeaveBalances(queryYear),
    staleTime: 30000, // 30 seconds deduping
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: 2000,
  });
};

export default useLeaveBalances;
