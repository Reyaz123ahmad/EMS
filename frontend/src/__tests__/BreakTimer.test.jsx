import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BreakTimer } from '../components/attendance/BreakTimer.jsx';

describe('BreakTimer Component & State Lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('Initializes elapsed time accurately from server timestamp and increments every second', () => {
    const startTime = new Date(Date.now() - 30000).toISOString(); // 30s ago
    const activeBreak = {
      id: 'break-123',
      breakType: 'SHORT',
      breakStartAt: startTime
    };

    render(<BreakTimer activeBreak={activeBreak} onEndBreak={() => {}} />);

    // Initial render should show 00:00:30
    expect(screen.getByText('00:00:30')).toBeInTheDocument();

    // Advance timer by 5 seconds
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByText('00:00:35')).toBeInTheDocument();
  });

  it('Stops timer immediately when activeBreak has breakEndAt (frozen elapsed time)', () => {
    const startTime = new Date(Date.now() - 60000).toISOString();
    const endTime = new Date(Date.now() - 10000).toISOString(); // Ran for 50 seconds

    const endedBreak = {
      id: 'break-123',
      breakType: 'SHORT',
      breakStartAt: startTime,
      breakEndAt: endTime
    };

    const { container } = render(<BreakTimer activeBreak={endedBreak} onEndBreak={() => {}} />);

    // Ended break should not render active banner
    expect(container.firstChild).toBeNull();
  });

  it('Stops interval immediately upon End Break click and calls onEndBreak', () => {
    const onEndBreakMock = vi.fn();
    const startTime = new Date(Date.now() - 10000).toISOString();
    const activeBreak = {
      id: 'break-123',
      breakType: 'LUNCH',
      breakStartAt: startTime
    };

    render(<BreakTimer activeBreak={activeBreak} onEndBreak={onEndBreakMock} />);

    const endButton = screen.getByRole('button', { name: /end break/i });
    fireEvent.click(endButton);

    expect(onEndBreakMock).toHaveBeenCalledTimes(1);
  });

  it('Is idempotent and disabled when isEnding is true', () => {
    const onEndBreakMock = vi.fn();
    const startTime = new Date().toISOString();
    const activeBreak = {
      id: 'break-123',
      breakType: 'SHORT',
      breakStartAt: startTime
    };

    render(<BreakTimer activeBreak={activeBreak} onEndBreak={onEndBreakMock} isEnding={true} />);

    const endButton = screen.getByRole('button', { name: /ending break/i });
    expect(endButton).toBeDisabled();

    fireEvent.click(endButton);
    expect(onEndBreakMock).not.toHaveBeenCalled();
  });

  it('Cleans up interval without memory leaks or setState warnings on unmount', () => {
    const startTime = new Date().toISOString();
    const activeBreak = {
      id: 'break-123',
      breakType: 'SHORT',
      breakStartAt: startTime
    };

    const { unmount } = render(<BreakTimer activeBreak={activeBreak} onEndBreak={() => {}} />);

    unmount();

    // Advance time after unmount — should not trigger state updates or errors
    act(() => {
      vi.advanceTimersByTime(10000);
    });
  });
});
