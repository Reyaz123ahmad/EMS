import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AttendancePage from '../pages/attendance/AttendancePage.jsx';
import AttendanceCalendarPage from '../pages/attendance/AttendanceCalendarPage.jsx';
import AttendanceExceptionsPage from '../pages/attendance/AttendanceExceptionsPage.jsx';
import ManualAttendancePage from '../pages/attendance/ManualAttendancePage.jsx';

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

describe('Attendance UI Modules', () => {
  it('renders Attendance Page with Mode selector and action buttons', () => {
    renderWithProviders(<AttendancePage />);
    expect(screen.getByText(/Attendance Verification/i)).toBeInTheDocument();
    expect(screen.getByText(/Sync State/i)).toBeInTheDocument();
  });

  it('renders Attendance Calendar Page with month view', () => {
    renderWithProviders(<AttendanceCalendarPage />);
    expect(screen.getByText(/Attendance Calendar/i)).toBeInTheDocument();
  });

  it('renders Attendance Exceptions Page', () => {
    renderWithProviders(<AttendanceExceptionsPage />);
    expect(screen.getByText(/Attendance Exceptions/i)).toBeInTheDocument();
  });

  it('renders Manual Attendance Page form', () => {
    renderWithProviders(<ManualAttendancePage />);
    expect(screen.getAllByText(/Manual Attendance Override/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Record Attendance/i)).toBeInTheDocument();
  });
});
