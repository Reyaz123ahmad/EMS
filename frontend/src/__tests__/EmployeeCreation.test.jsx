import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CreateEmployeePage from '../pages/employees/CreateEmployeePage.jsx';

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

describe('Employee Creation 2-Step OTP Wizard UI', () => {
  it('renders Step 1 Employee Onboarding Form', () => {
    renderWithProviders(<CreateEmployeePage />);
    expect(screen.getByText(/Onboard New Employee/i)).toBeInTheDocument();
    expect(screen.getByText(/Personal Information/i)).toBeInTheDocument();
  });
});
