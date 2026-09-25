import { describe, it, expect, beforeAll } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RevenueDashboardPage from '../pages/payment-analytics/RevenueDashboardPage.jsx';
import ChurnAnalysisPage from '../pages/payment-analytics/ChurnAnalysisPage.jsx';
import PaymentSuccessPage from '../pages/payment-analytics/PaymentSuccessPage.jsx';
import RefundAnalyticsPage from '../pages/payment-analytics/RefundAnalyticsPage.jsx';

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

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

describe('Payment Analytics Frontend UI', () => {
  it('renders Revenue Dashboard with MRR, ARR, and charts', () => {
    renderWithProviders(<RevenueDashboardPage />);
    expect(screen.getByText(/Revenue & Financial Analytics/i)).toBeInTheDocument();
    expect(screen.getByText(/Monthly Recurring Revenue \(MRR\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Annual Run Rate \(ARR\)/i)).toBeInTheDocument();
  });

  it('renders Churn Analysis Page with retention rate and charts', () => {
    renderWithProviders(<ChurnAnalysisPage />);
    expect(screen.getByText(/Subscriber Retention & Churn Analysis/i)).toBeInTheDocument();
    expect(screen.getByText(/Current Churn Rate/i)).toBeInTheDocument();
    expect(screen.getByText(/Platform Retention Rate/i)).toBeInTheDocument();
  });

  it('renders Payment Success Page with capture rate and methods', () => {
    renderWithProviders(<PaymentSuccessPage />);
    expect(screen.getByText(/Payment Success & Gateway Reliability/i)).toBeInTheDocument();
    expect(screen.getByText(/Overall Capture Rate/i)).toBeInTheDocument();
  });

  it('renders Refund Analytics Page with dispute breakdown', () => {
    renderWithProviders(<RefundAnalyticsPage />);
    expect(screen.getByText(/Refund & Dispute Analytics/i)).toBeInTheDocument();
    expect(screen.getByText(/Overall Refund Rate/i)).toBeInTheDocument();
  });
});
