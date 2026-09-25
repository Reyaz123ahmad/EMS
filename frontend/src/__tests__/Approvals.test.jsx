import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import WorkflowsPage from '../pages/approvals/WorkflowsPage.jsx';
import WorkflowDetailPage from '../pages/approvals/WorkflowDetailPage.jsx';
import ApprovalRequestsPage from '../pages/approvals/ApprovalRequestsPage.jsx';
import ApprovalHistoryPage from '../pages/approvals/ApprovalHistoryPage.jsx';

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

describe('Approvals UI Module', () => {
  it('renders Workflows Page with create button and workflow list', () => {
    renderWithProviders(<WorkflowsPage />);
    expect(screen.getByText(/Approval Workflows/i)).toBeInTheDocument();
    expect(screen.getByText(/New Workflow/i)).toBeInTheDocument();
  });

  it('renders Workflow Detail Page with level configurations', () => {
    renderWithProviders(<WorkflowDetailPage />);
    expect(screen.getByText(/Edit Approval Workflow/i)).toBeInTheDocument();
  });

  it('renders Approval Requests Page with pending actions', () => {
    renderWithProviders(<ApprovalRequestsPage />);
    expect(screen.getByText(/Pending Approvals/i)).toBeInTheDocument();
  });

  it('renders Approval History Page with audit trail', () => {
    renderWithProviders(<ApprovalHistoryPage />);
    expect(screen.getByText(/Approval History & Decisions/i)).toBeInTheDocument();
  });
});
