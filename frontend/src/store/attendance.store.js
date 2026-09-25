import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useAttendanceStore = create(
  persist(
    (set, get) => ({
      todayStatus: null,
      isCheckedIn: false,
      isOnBreak: false,
      activeBreak: null,
      breaks: [],
      lastCheckIn: null,
      activeMode: 'face',

      setTodayStatus: (statusData) => {
        const attendance = statusData?.attendance;
        const breaks = statusData?.breaks || [];
        const isCheckedIn = Boolean(attendance?.checkInAt && !attendance?.checkOutAt);
        const activeBreak = breaks.find((b) => !b.breakEndAt) || null;
        const isOnBreak = Boolean(activeBreak);

        set({
          todayStatus: statusData,
          isCheckedIn,
          isOnBreak,
          activeBreak,
          breaks,
          lastCheckIn: attendance?.checkInAt || null,
        });
      },

      updateCheckIn: (attendance) => {
        set((state) => ({
          isCheckedIn: true,
          lastCheckIn: attendance?.checkInAt || new Date().toISOString(),
          todayStatus: {
            ...state.todayStatus,
            attendance,
          },
        }));
      },

      updateCheckOut: (attendance) => {
        set((state) => ({
          isCheckedIn: false,
          isOnBreak: false,
          activeBreak: null,
          todayStatus: {
            ...state.todayStatus,
            attendance,
          },
        }));
      },

      addBreak: (breakItem) => {
        set((state) => {
          const updatedBreaks = [...state.breaks, breakItem];
          return {
            isOnBreak: true,
            activeBreak: breakItem,
            breaks: updatedBreaks,
            todayStatus: {
              ...state.todayStatus,
              breaks: updatedBreaks,
            },
          };
        });
      },

      endBreak: (breakItem) => {
        set((state) => {
          const updatedBreaks = state.breaks.map((b) =>
            b.id === breakItem.id ? breakItem : b
          );
          return {
            isOnBreak: false,
            activeBreak: null,
            breaks: updatedBreaks,
            todayStatus: {
              ...state.todayStatus,
              breaks: updatedBreaks,
            },
          };
        });
      },

      setActiveMode: (mode) => set({ activeMode: mode }),

      reset: () =>
        set({
          todayStatus: null,
          isCheckedIn: false,
          isOnBreak: false,
          activeBreak: null,
          breaks: [],
          lastCheckIn: null,
          activeMode: 'face',
        }),
    }),
    {
      name: 'ems-attendance-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activeMode: state.activeMode,
        isCheckedIn: state.isCheckedIn,
        isOnBreak: state.isOnBreak,
        activeBreak: state.activeBreak,
        lastCheckIn: state.lastCheckIn,
      }),
    }
  )
);
