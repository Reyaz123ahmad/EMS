import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CreateCompanyPage from '../pages/companies/CreateCompanyPage.jsx';

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

describe('Company Creation 2-Step OTP Wizard UI', () => {
  it('renders Step 1 Company and Admin details form by default', () => {
    renderWithProviders(<CreateCompanyPage />);
    expect(screen.getByText(/Create Enterprise Company/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Apex Global Technologies/i)).toBeInTheDocument();
  });
});
