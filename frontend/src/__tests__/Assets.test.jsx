import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AssetListPage from '../pages/assets/AssetListPage.jsx';
import AssignAssetPage from '../pages/assets/AssignAssetPage.jsx';
import ReturnAssetPage from '../pages/assets/ReturnAssetPage.jsx';
import AssetCategoriesPage from '../pages/assets/AssetCategoriesPage.jsx';

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
  it('renders Asset List Page with stats and inventory table', () => {
    renderWithProviders(<AssetListPage />);
    expect(screen.getByText(/Asset Inventory/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Assets/i)).toBeInTheDocument();
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
