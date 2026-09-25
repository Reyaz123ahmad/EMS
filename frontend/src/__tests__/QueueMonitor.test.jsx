import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import QueueMonitorPage from '../pages/admin/QueueMonitorPage.jsx';
import QueueDetailPage from '../pages/admin/QueueDetailPage.jsx';

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

describe('Queue Monitor UI Module', () => {
  it('renders Queue Monitor Page with health summary and queues grid', () => {
    renderWithProviders(<QueueMonitorPage />);
    expect(screen.getByText(/Background Queue Monitor/i)).toBeInTheDocument();
    expect(screen.getByText(/System Health/i)).toBeInTheDocument();
  });

  it('renders Queue Detail Page with jobs table and action toolbar', () => {
    renderWithProviders(<QueueDetailPage />);
    expect(screen.getByText(/Inspecting jobs and tasks in this queue/i)).toBeInTheDocument();
    expect(screen.getByText(/Refresh/i)).toBeInTheDocument();
  });
});
