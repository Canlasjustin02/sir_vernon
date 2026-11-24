import api from '../api';

export interface LaundryShop {
  _id: string;
  name: string;
  email: string;
  telephone: string;
  address?: string;
  isActive: boolean;
}

export const shopService = {
  getAvailableShops: async (): Promise<LaundryShop[]> => {
    const response = await api.get('/users', { params: { role: 'ADMIN' } });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to load laundry shops');
    }

    return (response.data.data as LaundryShop[]).filter((shop) => shop.isActive);
  },
};

export default shopService;