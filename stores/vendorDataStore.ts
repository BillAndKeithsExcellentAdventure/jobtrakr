import { VendorData } from 'jobdb';
import { create } from 'zustand';

export type VendorsDataStore = {
  allVendors: VendorData[];
  setVendorData: (data: VendorData[]) => void;
  addVendor: (receipt: VendorData) => void;
  removeVendor: (id: string) => void;
  updateVendor: (id: string, updatedReceipt: Partial<VendorData>) => void;
};

export const useVendorDataStore = create<VendorsDataStore>((set) => ({
  allVendors: [],
  setVendorData: (data) => set({ allVendors: data }),
  addVendor: (vendor) => set((state) => ({ allVendors: [...state.allVendors, vendor] })),
  removeVendor: (id) =>
    set((state) => ({
      allVendors: state.allVendors.filter((vendor) => vendor._id! !== id),
    })),
  updateVendor: (id, updatedVendor) =>
    set((state) => ({
      allVendors: state.allVendors.map((vendor) =>
        vendor._id === id ? { ...vendor, ...updatedVendor } : vendor,
      ),
    })),
}));
