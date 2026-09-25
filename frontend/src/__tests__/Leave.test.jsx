import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ApplyLeavePage from '../pages/leave/ApplyLeavePage.jsx';
import LeaveRequestsPage from '../pages/leave/LeaveRequestsPage.jsx';
import LeaveTypesPage from '../pages/leave/LeaveTypesPage.jsx';
import LeaveCalendarPage from '../pages/leave/LeaveCalendarPage.jsx';

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

describe('Leave Management UI Modules', () => {
  it('renders Apply Leave Page with submission form', () => {
    renderWithProviders(<ApplyLeavePage />);
    expect(screen.getByText(/Apply for Leave/i)).toBeInTheDocument();
    expect(screen.getByText(/Submit Leave Application/i)).toBeInTheDocument();
  });

  it('renders Leave Requests Page with filters', () => {
    renderWithProviders(<LeaveRequestsPage />);
    expect(screen.getByText(/Leave Requests/i)).toBeInTheDocument();
  });

  it('renders Leave Types configuration Page', () => {
    renderWithProviders(<LeaveTypesPage />);
    expect(screen.getByText(/Leave Types/i)).toBeInTheDocument();
    expect(screen.getByText(/\+ Add Leave Type/i)).toBeInTheDocument();
  });

  it('renders Leave Calendar Page', () => {
    renderWithProviders(<LeaveCalendarPage />);
    expect(screen.getByText(/Leave Calendar/i)).toBeInTheDocument();
  });
});
