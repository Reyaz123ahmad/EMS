import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ReportsPage from '../pages/reports/ReportsPage.jsx';

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

describe('Reports & Analytics UI', () => {
  it('renders report categories and filter parameters', () => {
    renderWithProviders(<ReportsPage />);
    expect(screen.getByText(/Analytics & Reports/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Attendance & Punches/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Employee Directory/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Run Report Query/i)[0]).toBeInTheDocument();
  });
});
