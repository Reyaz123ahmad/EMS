import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ApplyOvertimePage from '../pages/overtime/ApplyOvertimePage.jsx';
import OvertimeRequestsPage from '../pages/overtime/OvertimeRequestsPage.jsx';
import OvertimeRulesPage from '../pages/overtime/OvertimeRulesPage.jsx';
import OvertimeStatsPage from '../pages/overtime/OvertimeStatsPage.jsx';

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

describe('Overtime UI Modules', () => {
  it('renders Apply Overtime Page form', () => {
    renderWithProviders(<ApplyOvertimePage />);
    expect(screen.getByText(/Claim Overtime Hours/i)).toBeInTheDocument();
    expect(screen.getByText(/Submit Overtime Claim/i)).toBeInTheDocument();
  });

  it('renders Overtime Requests and Approvals Page', () => {
    renderWithProviders(<OvertimeRequestsPage />);
    expect(screen.getByText(/Overtime Approval Requests/i)).toBeInTheDocument();
  });

  it('renders Overtime Calculation Rules Page', () => {
    renderWithProviders(<OvertimeRulesPage />);
    expect(screen.getByText(/Overtime Compensation Policies/i)).toBeInTheDocument();
    expect(screen.getByText(/\+ Add Overtime Rule/i)).toBeInTheDocument();
  });

  it('renders Overtime Analytics & Stats Page', () => {
    renderWithProviders(<OvertimeStatsPage />);
    expect(screen.getByText(/Overtime Analytics & Trends/i)).toBeInTheDocument();
  });
});
