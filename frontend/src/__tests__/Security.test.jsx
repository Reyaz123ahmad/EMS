import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SecurityDashboardPage from '../pages/security/SecurityDashboardPage.jsx';
import FraudSignalsPage from '../pages/security/FraudSignalsPage.jsx';
import SecurityEventsPage from '../pages/security/SecurityEventsPage.jsx';
import AuditLogsPage from '../pages/security/AuditLogsPage.jsx';
import BlockedEmployeesPage from '../pages/security/BlockedEmployeesPage.jsx';

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

describe('Advanced Security UI Module', () => {
  it('renders Security Dashboard Page with scores and cards', () => {
    renderWithProviders(<SecurityDashboardPage />);
    expect(screen.getByText(/Advanced Security Command Center/i)).toBeInTheDocument();
  });

  it('renders Fraud Signals Page with filterable signals', () => {
    renderWithProviders(<FraudSignalsPage />);
    expect(screen.getByText(/Fraud & Spoof Signals/i)).toBeInTheDocument();
  });

  it('renders Security Events Page with activity timeline', () => {
    renderWithProviders(<SecurityEventsPage />);
    expect(screen.getByText(/Security Events & Stream/i)).toBeInTheDocument();
  });

  it('renders Audit Logs Page with export capabilities', () => {
    renderWithProviders(<AuditLogsPage />);
    expect(screen.getByText(/Compliance Audit Trail/i)).toBeInTheDocument();
  });

  it('renders Blocked Employees Page with unblock controls', () => {
    renderWithProviders(<BlockedEmployeesPage />);
    expect(screen.getByText(/Blocked & Suspended Employees/i)).toBeInTheDocument();
  });
});
