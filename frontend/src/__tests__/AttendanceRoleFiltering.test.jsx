import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useAuthStore from '../store/auth.store.js';
import AttendanceLogsPage from '../pages/attendance/AttendanceLogsPage.jsx';
import AttendanceCalendarPage from '../pages/attendance/AttendanceCalendarPage.jsx';
import MonthlySummaryPage from '../pages/attendance/MonthlySummaryPage.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false }
  }
});

function renderWithProviders(ui) {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  );
}

describe('Attendance Role-Based Filters & Columns', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  describe('When user role is EMPLOYEE', () => {
    beforeEach(() => {
      useAuthStore.setState({
        user: { id: 'emp-123', employeeId: 'emp-123', role: 'EMPLOYEE', firstName: 'Ejaz', lastName: 'Ahmad' },
        isAuthenticated: true
      });
    });

    it('Employee logs: hides search bar and employee column, shows Date and Status filters', () => {
      renderWithProviders(<AttendanceLogsPage />);
      expect(screen.getByText('My Attendance Logs')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/Search by employee name/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('columnheader', { name: /^Employee$/i })).not.toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /^Date$/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /^Status$/i })).toBeInTheDocument();
      expect(screen.getByText(/All Statuses/i)).toBeInTheDocument();
    });

    it('Employee calendar: hides employee dropdown and shows My Attendance Calendar title', () => {
      renderWithProviders(<AttendanceCalendarPage />);
      expect(screen.getByText('My Attendance Calendar')).toBeInTheDocument();
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
      expect(screen.queryByText(/All Employees/i)).not.toBeInTheDocument();
    });

    it('Employee monthly summary: hides employee dropdown and shows My Monthly Attendance Summary title', () => {
      renderWithProviders(<MonthlySummaryPage />);
      expect(screen.getByText('My Monthly Attendance Summary')).toBeInTheDocument();
      expect(screen.queryByText(/All Employees/i)).not.toBeInTheDocument();
    });
  });

  describe('When user role is HR_ADMIN', () => {
    beforeEach(() => {
      useAuthStore.setState({
        user: { id: 'admin-1', role: 'HR_ADMIN', firstName: 'HR', lastName: 'Admin' },
        isAuthenticated: true
      });
    });

    it('HR Admin logs: shows search bar and Employee column', () => {
      renderWithProviders(<AttendanceLogsPage />);
      expect(screen.getByText('Attendance Records & Logs')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Search by employee name/i)).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /^Employee$/i })).toBeInTheDocument();
    });

    it('HR Admin calendar: shows employee dropdown and Attendance Calendar title', () => {
      renderWithProviders(<AttendanceCalendarPage />);
      expect(screen.getByText('Attendance Calendar')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByText(/All Employees/i)).toBeInTheDocument();
    });

    it('HR Admin monthly summary: shows employee dropdown and Monthly Attendance Summary title', () => {
      renderWithProviders(<MonthlySummaryPage />);
      expect(screen.getByText('Monthly Attendance Summary')).toBeInTheDocument();
      expect(screen.getByText(/All Employees/i)).toBeInTheDocument();
    });
  });
});
