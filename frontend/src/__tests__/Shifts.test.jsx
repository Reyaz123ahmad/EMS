import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ShiftListPage from '../pages/shifts/ShiftListPage.jsx';
import AssignShiftPage from '../pages/shifts/AssignShiftPage.jsx';
import GenerateRosterPage from '../pages/shifts/GenerateRosterPage.jsx';
import RosterCalendarPage from '../pages/shifts/RosterCalendarPage.jsx';

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

describe('Shift & Roster UI Modules', () => {
  it('renders Shift Master List Page', () => {
    renderWithProviders(<ShiftListPage />);
    expect(screen.getByText(/Work Shift Master/i)).toBeInTheDocument();
    expect(screen.getByText(/\+ Create Shift/i)).toBeInTheDocument();
  });

  it('renders Shift Assignment Page', () => {
    renderWithProviders(<AssignShiftPage />);
    expect(screen.getByText(/Assign Shift Schedule/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Assign Shift/i })).toBeInTheDocument();
  });

  it('renders Automated Roster Generation Page', () => {
    renderWithProviders(<GenerateRosterPage />);
    expect(screen.getByText(/Automated Roster Generator/i)).toBeInTheDocument();
    expect(screen.getByText(/Generate Roster Batch/i)).toBeInTheDocument();
  });

  it('renders Roster Calendar Schedule Page', () => {
    renderWithProviders(<RosterCalendarPage />);
    expect(screen.getByText(/Monthly Roster Schedule/i)).toBeInTheDocument();
  });
});
