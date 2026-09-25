import { create } from 'zustand';

export const useSubscriptionStore = create((set) => ({
  subscription: null,
  plan: null,
  isExpired: false,
  daysRemaining: 30,

  setSubscription: (sub) => {
    if (!sub) {
      set({ subscription: null, plan: null, isExpired: false, daysRemaining: 0 });
      return;
    }

    const now = new Date();
    const endDate = sub.endDate ? new Date(sub.endDate) : (sub.trialEndsAt ? new Date(sub.trialEndsAt) : null);
    
    let daysRemaining = 30;
    let isExpired = false;

    if (endDate) {
      const diffTime = endDate - now;
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      isExpired = daysRemaining <= 0 || sub.status === 'EXPIRED' || sub.status === 'CANCELLED';
    }

    set({
      subscription: sub,
      plan: sub.plan,
      isExpired,
      daysRemaining: Math.max(0, daysRemaining)
    });
  },

  clearSubscription: () => {
    set({
      subscription: null,
      plan: null,
      isExpired: false,
      daysRemaining: 0
    });
  }
}));

export default useSubscriptionStore;
