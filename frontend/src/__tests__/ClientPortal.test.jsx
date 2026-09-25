import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ClientDashboardPage from '../pages/client-portal/ClientDashboardPage.jsx';
import ClientProjectsPage from '../pages/client-portal/ClientProjectsPage.jsx';
import ClientRequirementsPage from '../pages/client-portal/ClientRequirementsPage.jsx';
import ClientCommentsPage from '../pages/client-portal/ClientCommentsPage.jsx';
import ClientInvoicesPage from '../pages/client-portal/ClientInvoicesPage.jsx';
import ClientPaymentsPage from '../pages/client-portal/ClientPaymentsPage.jsx';

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

describe('Client Portal Frontend UI', () => {
  it('renders Client Dashboard overview with quick stats and project links', () => {
    renderWithProviders(<ClientDashboardPage />);
    expect(screen.getByText(/Welcome to Your Project Portal/i)).toBeInTheDocument();
    expect(screen.getByText(/Client Self-Service Hub/i)).toBeInTheDocument();
    expect(screen.getByText(/Your Projects & Contracts/i)).toBeInTheDocument();
  });

  it('renders Client Projects Page with search input', () => {
    renderWithProviders(<ClientProjectsPage />);
    expect(screen.getByRole('heading', { name: 'Your Projects' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search project by name/i)).toBeInTheDocument();
  });

  it('renders Client Requirements Submission Form', () => {
    renderWithProviders(<ClientRequirementsPage />);
    expect(screen.getByText(/Submit New Requirement/i)).toBeInTheDocument();
    expect(screen.getByText(/Detailed Specifications & Acceptance Criteria/i)).toBeInTheDocument();
  });

  it('renders Client Discussions / Comments Page', () => {
    renderWithProviders(<ClientCommentsPage />);
    expect(screen.getByText(/Project Discussions/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Type your message, query, or feedback here/i)).toBeInTheDocument();
  });

  it('renders Client Invoices Page', () => {
    renderWithProviders(<ClientInvoicesPage />);
    expect(screen.getByRole('heading', { name: /Invoices & Billing/i })).toBeInTheDocument();
  });

  it('renders Client Payment History Page', () => {
    renderWithProviders(<ClientPaymentsPage />);
    expect(screen.getByRole('heading', { name: /Payment History/i })).toBeInTheDocument();
  });
});
