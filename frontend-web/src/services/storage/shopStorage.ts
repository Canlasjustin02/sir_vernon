const SHOP_KEY = "ecoshine_selected_shop_id";

export const shopStorage = {
  get(): string | null {
    return localStorage.getItem(SHOP_KEY);
  },
  set(shopId: string): void {
    localStorage.setItem(SHOP_KEY, shopId);
  },
  clear(): void {
    localStorage.removeItem(SHOP_KEY);
  },
};
