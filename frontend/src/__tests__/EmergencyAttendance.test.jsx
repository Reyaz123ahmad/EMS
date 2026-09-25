import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import EmergencyAttendancePage from '../pages/emergency-attendance/EmergencyAttendancePage.jsx';
import EmergencyRequestsPage from '../pages/emergency-attendance/EmergencyRequestsPage.jsx';
import EmergencyStatsPage from '../pages/emergency-attendance/EmergencyStatsPage.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

function renderWithProviders(ui) {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  );
}

describe('Emergency Attendance UI Module', () => {
  it('renders Emergency Attendance submission form', () => {
    renderWithProviders(<EmergencyAttendancePage />);
    expect(screen.getByText(/Emergency Attendance Punch/i)).toBeInTheDocument();
    expect(screen.getByText(/Submit Emergency Attendance/i)).toBeInTheDocument();
  });

  it('renders Emergency Requests Review Page with bulk approvals', () => {
    renderWithProviders(<EmergencyRequestsPage />);
    expect(screen.getByText(/Emergency Attendance Requests/i)).toBeInTheDocument();
    expect(screen.getByText(/Bulk Approve/i)).toBeInTheDocument();
  });

  it('renders Emergency Stats Dashboard with analytics', () => {
    renderWithProviders(<EmergencyStatsPage />);
    expect(screen.getByText(/Emergency Attendance Statistics/i)).toBeInTheDocument();
  });
});
