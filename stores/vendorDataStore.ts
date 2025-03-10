import { create } from 'zustand';

export type VendorEntry = {
  label: string;
  _id?: string;
};

export type VendorsDataStore = {
  allVendors: VendorEntry[];
  setVendorData: (data: VendorEntry[]) => void;
  addVendor: (receipt: VendorEntry) => void;
  removeVendor: (id: string) => void;
  updateVendor: (id: string, updatedReceipt: Partial<VendorEntry>) => void;
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
