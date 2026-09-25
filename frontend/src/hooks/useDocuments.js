import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import documentService from '../services/document.service.js';

export function useDocuments(params = {}) {
  return useQuery({
    queryKey: ['documents', params],
    queryFn: () => documentService.getDocuments(params)
  });
}

export function useDocument(id) {
  return useQuery({
    queryKey: ['document', id],
    queryFn: () => documentService.getDocument(id),
    enabled: !!id
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData) => documentService.uploadDocument(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document-stats'] });
    }
  });
}

export function useVerifyDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => documentService.verifyDocument(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['document', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document-stats'] });
    }
  });
}

export function useRejectDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => documentService.rejectDocument(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['document', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document-stats'] });
    }
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => documentService.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document-stats'] });
    }
  });
}

export function useDownloadDocument() {
  return useMutation({
    mutationFn: (id) => documentService.downloadDocument(id)
  });
}

export function useDocumentStats() {
  return useQuery({
    queryKey: ['document-stats'],
    queryFn: () => documentService.getDocumentStats()
  });
}

// ================= Aadhaar React Query Hooks =================

export function useAadhaarMode() {
  return useQuery({
    queryKey: ['aadhaar-mode'],
    queryFn: () => documentService.getAadhaarMode(),
    staleTime: 5 * 60 * 1000
  });
}

export function useSendAadhaarOTP() {
  return useMutation({
    mutationFn: (data) => documentService.sendAadhaarOTP(data)
  });
}

export function useVerifyAadhaarOTP() {
  return useMutation({
    mutationFn: (data) => documentService.verifyAadhaarOTP(data)
  });
}

export function useUploadAadhaar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData) => documentService.uploadAadhaar(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document-stats'] });
      queryClient.invalidateQueries({ queryKey: ['aadhaar-verifications'] });
    }
  });
}

export default {
  useDocuments,
  useDocument,
  useUploadDocument,
  useVerifyDocument,
  useRejectDocument,
  useDeleteDocument,
  useDownloadDocument,
  useDocumentStats,
  useAadhaarMode,
  useSendAadhaarOTP,
  useVerifyAadhaarOTP,
  useUploadAadhaar
};
