import { useMutation } from '@tanstack/react-query';
import { attendanceSecurityService } from '../services/attendance-security.service';

export const useCreateChallenge = () => {
  return useMutation({
    mutationFn: (data) => attendanceSecurityService.createLivenessChallenge(data),
  });
};

export const useVerifyLiveness = () => {
  return useMutation({
    mutationFn: (data) => attendanceSecurityService.verifyLiveness(data),
  });
};
