import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import AIChatbotWidget from '../components/ai/AIChatbotWidget';
import useAuthStore from '../store/auth.store';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} })
  }
}));

const renderWithProviders = (ui) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe('AI Role Access Control', () => {
  it('SUPER_ADMIN has AI in sidebar and sees floating AI widget', () => {
    useAuthStore.setState({
      user: { id: '1', role: 'SUPER_ADMIN', roles: ['SUPER_ADMIN'] },
      token: 'valid-token'
    });

    const { container: sidebarContainer } = renderWithProviders(<Sidebar />);
    expect(sidebarContainer.textContent).toContain('AI Intelligence');

    const { container: widgetContainer } = renderWithProviders(<AIChatbotWidget />);
    expect(widgetContainer.querySelector('#ems-ai-assistant-toggle')).not.toBeNull();
  });

  it('COMPANY_ADMIN has AI in sidebar and sees floating AI widget', () => {
    useAuthStore.setState({
      user: { id: '2', role: 'COMPANY_ADMIN', roles: ['COMPANY_ADMIN'] },
      token: 'valid-token'
    });

    const { container: sidebarContainer } = renderWithProviders(<Sidebar />);
    expect(sidebarContainer.textContent).toContain('AI Intelligence');

    const { container: widgetContainer } = renderWithProviders(<AIChatbotWidget />);
    expect(widgetContainer.querySelector('#ems-ai-assistant-toggle')).not.toBeNull();
  });

  it('HR_ADMIN does NOT have AI in sidebar or floating AI widget', () => {
    useAuthStore.setState({
      user: { id: '3', role: 'HR_ADMIN', roles: ['HR_ADMIN'] },
      token: 'valid-token'
    });

    const { container: sidebarContainer } = renderWithProviders(<Sidebar />);
    expect(sidebarContainer.textContent).not.toContain('AI Intelligence');
    expect(sidebarContainer.textContent).not.toContain('AI Hub');

    const { container: widgetContainer } = renderWithProviders(<AIChatbotWidget />);
    expect(widgetContainer.querySelector('#ems-ai-assistant-toggle')).toBeNull();
  });

  it('HR_MANAGER does NOT have AI in sidebar or floating AI widget', () => {
    useAuthStore.setState({
      user: { id: '4', role: 'HR_MANAGER', roles: ['HR_MANAGER'] },
      token: 'valid-token'
    });

    const { container: sidebarContainer } = renderWithProviders(<Sidebar />);
    expect(sidebarContainer.textContent).not.toContain('AI Intelligence');
    expect(sidebarContainer.textContent).not.toContain('AI Hub');

    const { container: widgetContainer } = renderWithProviders(<AIChatbotWidget />);
    expect(widgetContainer.querySelector('#ems-ai-assistant-toggle')).toBeNull();
  });

  it('MANAGER does NOT have AI in sidebar or floating AI widget', () => {
    useAuthStore.setState({
      user: { id: '5', role: 'MANAGER', roles: ['MANAGER'] },
      token: 'valid-token'
    });

    const { container: sidebarContainer } = renderWithProviders(<Sidebar />);
    expect(sidebarContainer.textContent).not.toContain('AI Intelligence');
    expect(sidebarContainer.textContent).not.toContain('AI Hub');

    const { container: widgetContainer } = renderWithProviders(<AIChatbotWidget />);
    expect(widgetContainer.querySelector('#ems-ai-assistant-toggle')).toBeNull();
  });

  it('EMPLOYEE does NOT have AI in sidebar or floating AI widget', () => {
    useAuthStore.setState({
      user: { id: '6', role: 'EMPLOYEE', roles: ['EMPLOYEE'] },
      token: 'valid-token'
    });

    const { container: sidebarContainer } = renderWithProviders(<Sidebar />);
    expect(sidebarContainer.textContent).not.toContain('AI Intelligence');
    expect(sidebarContainer.textContent).not.toContain('AI Hub');
    expect(sidebarContainer.textContent).not.toContain('AI Assistant');

    const { container: widgetContainer } = renderWithProviders(<AIChatbotWidget />);
    expect(widgetContainer.querySelector('#ems-ai-assistant-toggle')).toBeNull();
  });
});
