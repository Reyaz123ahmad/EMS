import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HolidayCalendarPage from '../pages/holidays/HolidayCalendarPage.jsx';
import HolidayListPage from '../pages/holidays/HolidayListPage.jsx';
import HolidayAssignmentPage from '../pages/holidays/HolidayAssignmentPage.jsx';

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

import HolidayCalendar from '../components/holidays/HolidayCalendar.jsx';

describe('Holiday Calendar UI Modules', () => {
  it('renders Holiday Calendar Year Page', () => {
    renderWithProviders(<HolidayCalendarPage />);
    expect(screen.getByText(/Public & Festival Holidays/i)).toBeInTheDocument();
    expect(screen.getByText(/\+ Add Holiday/i)).toBeInTheDocument();
    expect(screen.getByText(/Import JSON/i)).toBeInTheDocument();
  });

  it('renders Holiday List Page', () => {
    renderWithProviders(<HolidayListPage />);
    expect(screen.getByText(/Holiday List/i)).toBeInTheDocument();
  });

  it('renders Holiday Assignment to Employees Page', () => {
    renderWithProviders(<HolidayAssignmentPage />);
    expect(screen.getByText(/Holiday Eligibility & Allocation/i)).toBeInTheDocument();
    expect(screen.getByText(/Assign Holiday Quota/i)).toBeInTheDocument();
  });

  it('safely renders HolidayCalendar component when holidays is undefined, null, or an object', () => {
    // Undefined
    const { unmount: u1 } = render(<HolidayCalendar year={2026} holidays={undefined} />);
    expect(screen.getByText(/Annual Public Holiday Schedule/i)).toBeInTheDocument();
    u1();

    // Null
    const { unmount: u2 } = render(<HolidayCalendar year={2026} holidays={null} />);
    expect(screen.getByText(/Annual Public Holiday Schedule/i)).toBeInTheDocument();
    u2();

    // Plain Object
    const { unmount: u3 } = render(<HolidayCalendar year={2026} holidays={{}} />);
    expect(screen.getByText(/Annual Public Holiday Schedule/i)).toBeInTheDocument();
    u3();

    // Valid array with holidays
    render(
      <HolidayCalendar
        year={2026}
        holidays={[{ id: 'h1', name: 'Republic Day', date: '2026-01-26', isOptional: false }]}
      />
    );
    expect(screen.getByText('Republic Day')).toBeInTheDocument();
  });
});
