import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RefundRequestPage from '../pages/refunds/RefundRequestPage.jsx';
import RefundListPage from '../pages/refunds/RefundListPage.jsx';
import AdminRefundListPage from '../pages/refunds/AdminRefundListPage.jsx';
import SystemIssueRefundPage from '../pages/refunds/SystemIssueRefundPage.jsx';
import RefundStatusBadge from '../components/refunds/RefundStatusBadge.jsx';

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

describe('Refunds Frontend UI', () => {
  it('renders Refund Request Page with form elements', () => {
    renderWithProviders(<RefundRequestPage />);
    expect(screen.getByText(/Request a Refund/i)).toBeInTheDocument();
    expect(screen.getByText(/Select Payment Transaction/i)).toBeInTheDocument();
  });

  it('renders Company Refund List Page with stats and filter bar', () => {
    renderWithProviders(<RefundListPage />);
    expect(screen.getByRole('heading', { name: 'Refunds' })).toBeInTheDocument();
    expect(screen.getByText(/Total Requested/i)).toBeInTheDocument();
  });

  it('renders Super Admin Refund Queue Page', () => {
    renderWithProviders(<AdminRefundListPage />);
    expect(screen.getByText(/Platform Refund Queue/i)).toBeInTheDocument();
    expect(screen.getByText(/Pending Review Queue/i)).toBeInTheDocument();
  });

  it('renders System Issue Refund Page for immediate payouts', () => {
    renderWithProviders(<SystemIssueRefundPage />);
    expect(screen.getByText(/Issue System-Level Refund/i)).toBeInTheDocument();
    expect(screen.getByText(/Target Company/i)).toBeInTheDocument();
  });

  it('renders RefundStatusBadge with proper styles', () => {
    renderWithProviders(<RefundStatusBadge status="PROCESSED" />);
    expect(screen.getByText(/Processed & Settled/i)).toBeInTheDocument();
  });
});
