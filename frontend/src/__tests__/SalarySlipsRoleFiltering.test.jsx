import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SalarySlipsPage from '../pages/payroll/SalarySlipsPage';
import useAuthStore from '../store/auth.store';
import payrollService from '../services/payroll.service';

vi.mock('../services/payroll.service');
vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  }
}));

describe('Salary Slips Role-Based Filtering', () => {
  let queryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  it('renders My Payslips without search bar for EMPLOYEE', async () => {
    useAuthStore.setState({
      user: {
        id: 'emp-1',
        role: 'EMPLOYEE',
        roles: ['EMPLOYEE'],
        companyId: 'comp-1',
      },
      token: 'mock-token',
    });

    payrollService.getMySlips.mockResolvedValue([
      {
        id: 'slip-1',
        slipNumber: 'SLIP-202609-001',
        payrollItem: {
          grossSalary: 50000,
          netSalary: 45000,
          totalDeductions: 5000,
          employee: {
            firstName: 'Ejaz',
            lastName: 'Ahmad',
            employeeCode: 'EMP-0001',
          },
          payrollRun: { month: 9, year: 2026 },
        },
      },
    ]);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SalarySlipsPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('My Payslips')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Search employee...')).not.toBeInTheDocument();

    await waitFor(() => {
      expect(payrollService.getMySlips).toHaveBeenCalled();
    });
  });

  it('renders Salary Slips with search bar for HR_ADMIN', async () => {
    useAuthStore.setState({
      user: {
        id: 'hr-1',
        role: 'HR_ADMIN',
        roles: ['HR_ADMIN'],
        companyId: 'comp-1',
      },
      token: 'mock-token',
    });

    payrollService.getAllSlips.mockResolvedValue([]);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SalarySlipsPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('Salary Slips')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search employee...')).toBeInTheDocument();

    await waitFor(() => {
      expect(payrollService.getAllSlips).toHaveBeenCalled();
    });
  });
});
