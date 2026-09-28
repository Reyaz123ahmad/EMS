import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ApplyLeavePage from '../pages/leave/ApplyLeavePage.jsx';
import LeaveRequestsPage from '../pages/leave/LeaveRequestsPage.jsx';
import LeaveTypesPage from '../pages/leave/LeaveTypesPage.jsx';
import LeaveCalendarPage from '../pages/leave/LeaveCalendarPage.jsx';

import LeaveBalanceCard from '../components/leave/LeaveBalanceCard.jsx';

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

  it('renders LeaveBalanceCard safely without props or with partial props', () => {
    // Missing prop
    const { unmount } = render(<LeaveBalanceCard />);
    expect(screen.getByText(/No balance data/i)).toBeInTheDocument();
    unmount();

    // Missing leaveType
    const { unmount: unmount2 } = render(<LeaveBalanceCard balance={{ totalDays: 10, usedDays: 2, remainingDays: 8 }} />);
    expect(screen.getAllByText(/Leave/i).length).toBeGreaterThan(0);
    expect(screen.getByText('8')).toBeInTheDocument();
    unmount2();

    // Full object
    render(
      <LeaveBalanceCard
        balance={{
          leaveType: { name: 'Annual Leave', code: 'AL', isPaid: true },
          totalDays: 20,
          usedDays: 5,
          remainingDays: 15
        }}
      />
    );
    expect(screen.getByText('Annual Leave')).toBeInTheDocument();
    expect(screen.getByText('AL')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('renders MyLeavePage with self-service headers and table', async () => {
    const { default: MyLeavePage } = await import('../pages/leave/MyLeavePage.jsx');
    renderWithProviders(<MyLeavePage />);
    expect(screen.getByText(/My Leave Requests/i)).toBeInTheDocument();
    expect(screen.getByText(/Apply Leave/i)).toBeInTheDocument();
  });

  it('renders LeaveHistoryPage with self-service history headers and table', async () => {
    const { default: LeaveHistoryPage } = await import('../pages/leave/LeaveHistoryPage.jsx');
    renderWithProviders(<LeaveHistoryPage />);
    expect(screen.getByText(/My Leave History/i)).toBeInTheDocument();
    expect(screen.getByText(/Apply Leave/i)).toBeInTheDocument();
  });
});
