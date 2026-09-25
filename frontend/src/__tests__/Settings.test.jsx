import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GeneralSettingsPage from '../pages/settings/GeneralSettingsPage.jsx';
import AttendanceSettingsPage from '../pages/settings/AttendanceSettingsPage.jsx';
import SecuritySettingsPage from '../pages/settings/SecuritySettingsPage.jsx';
import LeaveSettingsPage from '../pages/settings/LeaveSettingsPage.jsx';
import PayrollSettingsPage from '../pages/settings/PayrollSettingsPage.jsx';
import NotificationSettingsPage from '../pages/settings/NotificationSettingsPage.jsx';

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

describe('Settings UI Module', () => {
  it('renders General Settings Page', () => {
    renderWithProviders(<GeneralSettingsPage />);
    expect(screen.getByText(/Regional & Locale Preferences/i)).toBeInTheDocument();
  });

  it('renders Attendance Settings Page with verification modes', () => {
    renderWithProviders(<AttendanceSettingsPage />);
    expect(screen.getByText(/Allowed Biometric Modes/i)).toBeInTheDocument();
  });

  it('renders Security Settings Page with Zero-Trust configurations', () => {
    renderWithProviders(<SecuritySettingsPage />);
    expect(screen.getByText(/Security Level & Active Verification Layers/i)).toBeInTheDocument();
  });

  it('renders Leave Settings Page with accrual policies', () => {
    renderWithProviders(<LeaveSettingsPage />);
    expect(screen.getByText(/Leave Calendar Cycle & Carry Forward/i)).toBeInTheDocument();
  });

  it('renders Payroll Settings Page with statutory deductions', () => {
    renderWithProviders(<PayrollSettingsPage />);
    expect(screen.getByText(/Statutory Compliance Deductions/i)).toBeInTheDocument();
  });

  it('renders Notification Settings Page with channels and alerts', () => {
    renderWithProviders(<NotificationSettingsPage />);
    expect(screen.getByText(/Delivery Channels/i)).toBeInTheDocument();
  });
});
