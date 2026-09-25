import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CouponListPage from '../pages/coupons/CouponListPage.jsx';
import ApplyCouponPage from '../pages/coupons/ApplyCouponPage.jsx';

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

describe('Coupons Frontend UI', () => {
  it('renders Coupon List Page with create action', () => {
    renderWithProviders(<CouponListPage />);
    expect(screen.getByText(/Coupons & Promotional Discounts/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Coupon/i })).toBeInTheDocument();
  });

  it('renders ApplyCouponPage promo code input component', () => {
    renderWithProviders(<ApplyCouponPage planId="test-plan" originalAmount={5000} />);
    expect(screen.getByText(/Have a Promo \/ Discount Code\?/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/ENTER CODE/i)).toBeInTheDocument();
  });
});
