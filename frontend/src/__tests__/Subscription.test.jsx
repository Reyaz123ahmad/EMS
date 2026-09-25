import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PlansPage from '../pages/subscription/PlansPage.jsx';
import CurrentSubscriptionPage from '../pages/subscription/CurrentSubscriptionPage.jsx';
import UpgradeSubscriptionPage from '../pages/subscription/UpgradeSubscriptionPage.jsx';
import SubscriptionHistoryPage from '../pages/subscription/SubscriptionHistoryPage.jsx';
import RenewSubscriptionPage from '../pages/subscription/RenewSubscriptionPage.jsx';
import SubscriptionExpiredPage from '../pages/subscription/SubscriptionExpiredPage.jsx';

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

describe('Subscription UI Module', () => {
  it('renders Plans Page with title and description', () => {
    renderWithProviders(<PlansPage />);
    expect(screen.getByText(/Choose the Perfect Plan/i)).toBeInTheDocument();
  });

  it('renders Current Subscription Page with status and metrics', () => {
    renderWithProviders(<CurrentSubscriptionPage />);
    expect(screen.getByText(/Current Subscription/i)).toBeInTheDocument();
  });

  it('renders Upgrade Subscription Page with tier selection and checkout', () => {
    renderWithProviders(<UpgradeSubscriptionPage />);
    expect(screen.getByText(/Upgrade Subscription/i)).toBeInTheDocument();
    expect(screen.getByText(/Order Summary/i)).toBeInTheDocument();
  });

  it('renders Subscription History Page with invoices table', () => {
    renderWithProviders(<SubscriptionHistoryPage />);
    expect(screen.getByText(/Billing & Invoice History/i)).toBeInTheDocument();
  });

  it('renders Renew Subscription Page with renewal options', () => {
    renderWithProviders(<RenewSubscriptionPage />);
    expect(screen.getByText(/Renew Subscription/i)).toBeInTheDocument();
  });

  it('renders Subscription Expired Full-Page blocker', () => {
    renderWithProviders(<SubscriptionExpiredPage />);
    expect(screen.getByText(/Subscription Has Expired/i)).toBeInTheDocument();
    expect(screen.getByText(/Renew Subscription Now/i)).toBeInTheDocument();
  });
});
