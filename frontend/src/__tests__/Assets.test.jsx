import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AssetListPage from '../pages/assets/AssetListPage.jsx';
import AssignAssetPage from '../pages/assets/AssignAssetPage.jsx';
import ReturnAssetPage from '../pages/assets/ReturnAssetPage.jsx';
import AssetCategoriesPage from '../pages/assets/AssetCategoriesPage.jsx';

import useAuthStore from '../store/auth.store.js';

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

describe('Assets UI Module', () => {
  it('renders Asset List Page with stats and inventory for HR Admin', () => {
    useAuthStore.setState({
      user: { id: 'admin-1', role: 'HR_ADMIN' },
      isAuthenticated: true
    });
    renderWithProviders(<AssetListPage />);
    expect(screen.getByText(/Asset Inventory/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Assets/i)).toBeInTheDocument();
    expect(screen.getByText(/Add Asset/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^Categories$/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search by asset name/i)).toBeInTheDocument();
  });

  it('renders My Assets view for EMPLOYEE without admin controls', () => {
    useAuthStore.setState({
      user: { id: 'emp-1', employeeId: 'emp-1', role: 'EMPLOYEE' },
      isAuthenticated: true
    });
    renderWithProviders(<AssetListPage />);
    expect(screen.getByText(/My Assets/i)).toBeInTheDocument();
    expect(screen.getByText(/Assets assigned to you/i)).toBeInTheDocument();
    expect(screen.queryByText(/Total Assets/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Add Asset/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^Categories$/i })).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Search by asset name/i)).not.toBeInTheDocument();
  });

  it('renders Assign Asset Page with employee selection form', () => {
    renderWithProviders(<AssignAssetPage />);
    expect(screen.getByText(/Assign Asset/i)).toBeInTheDocument();
  });

  it('renders Return Asset Page with condition assessment form', () => {
    renderWithProviders(<ReturnAssetPage />);
    expect(screen.getByText(/Process Asset Return/i)).toBeInTheDocument();
  });

  it('renders Asset Categories Page with category management', () => {
    renderWithProviders(<AssetCategoriesPage />);
    expect(screen.getByText(/Asset Categories/i)).toBeInTheDocument();
    expect(screen.getByText(/Existing Categories/i)).toBeInTheDocument();
  });
});

