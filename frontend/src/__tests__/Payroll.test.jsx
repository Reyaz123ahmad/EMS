import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PayrollRunPage from '../pages/payroll/PayrollRunPage.jsx';
import PayrollRunsListPage from '../pages/payroll/PayrollRunsListPage.jsx';
import SalaryStructurePage from '../pages/payroll/SalaryStructurePage.jsx';
import SalarySlipsPage from '../pages/payroll/SalarySlipsPage.jsx';

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

describe('Payroll UI Modules', () => {
  it('renders Payroll Execution Run Page with preview triggers', () => {
    renderWithProviders(<PayrollRunPage />);
    expect(screen.getByText(/Execute Payroll Run/i)).toBeInTheDocument();
    expect(screen.getByText(/Calculate Preview/i)).toBeInTheDocument();
  });

  it('renders Payroll Runs List Page', () => {
    renderWithProviders(<PayrollRunsListPage />);
    expect(screen.getByText(/Payroll History & Batches/i)).toBeInTheDocument();
    expect(screen.getByText(/\+ New Payroll Run/i)).toBeInTheDocument();
  });

  it('renders Salary Structure Master Page', () => {
    renderWithProviders(<SalaryStructurePage />);
    expect(screen.getByText(/Salary Components & Rules/i)).toBeInTheDocument();
    expect(screen.getByText(/\+ Add Salary Component/i)).toBeInTheDocument();
  });

  it('renders Salary Slips Portal Page', () => {
    renderWithProviders(<SalarySlipsPage />);
    expect(screen.getByText(/Employee Salary Slips/i)).toBeInTheDocument();
  });
});
