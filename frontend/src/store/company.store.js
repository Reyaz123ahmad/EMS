import { create } from 'zustand';

export const useCompanyStore = create((set) => ({
  currentCompany: null,
  companies: [],

  setCurrentCompany: (company) => set({ currentCompany: company }),
  setCompanies: (companies) => set({ companies })
}));

export default useCompanyStore;
