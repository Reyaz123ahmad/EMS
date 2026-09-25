import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import holidayService from '../services/holiday.service.js';

export function useHolidayCalendars() {
  return useQuery({
    queryKey: ['holidays', 'calendars'],
    queryFn: () => holidayService.getHolidayCalendars()
  });
}

export function useCreateHolidayCalendar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => holidayService.createHolidayCalendar(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays', 'calendars'] });
    }
  });
}

export function useUpdateHolidayCalendar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => holidayService.updateHolidayCalendar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays', 'calendars'] });
    }
  });
}

export function useDeleteHolidayCalendar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => holidayService.deleteHolidayCalendar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays', 'calendars'] });
    }
  });
}

export function useHolidays(params = {}) {
  return useQuery({
    queryKey: ['holidays', 'list', params],
    queryFn: () => holidayService.getHolidays(params)
  });
}

export function useHolidayCalendar(params = {}) {
  return useQuery({
    queryKey: ['holidays', 'calendar-view', params],
    queryFn: () => holidayService.getCalendarView(params)
  });
}

export function useCreateHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => holidayService.createHoliday(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
    }
  });
}

export function useUpdateHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => holidayService.updateHoliday(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
    }
  });
}

export function useDeleteHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => holidayService.deleteHoliday(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
    }
  });
}

export function useBulkImportHolidays() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => holidayService.bulkImportHolidays(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
    }
  });
}

export function useAssignHolidays() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => holidayService.assignHolidays(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
    }
  });
}

export default {
  useHolidayCalendars,
  useCreateHolidayCalendar,
  useUpdateHolidayCalendar,
  useDeleteHolidayCalendar,
  useHolidays,
  useHolidayCalendar,
  useCreateHoliday,
  useUpdateHoliday,
  useDeleteHoliday,
  useBulkImportHolidays,
  useAssignHolidays
};
