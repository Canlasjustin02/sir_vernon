import AsyncStorage from "@react-native-async-storage/async-storage";

type StoredUser = {
  _id?: string;
  role?: string;
  shopOwnerId?: string | null;
};

export async function getShopContextId(): Promise<string | null> {
  const rawUser = await AsyncStorage.getItem("user");
  if (rawUser) {
    const user = JSON.parse(rawUser) as StoredUser;
    if (user.role === "ADMIN") return user._id ?? null;
    if (user.role === "STAFF") return user.shopOwnerId ?? null;
  }

  return AsyncStorage.getItem("selectedShopId");
}
