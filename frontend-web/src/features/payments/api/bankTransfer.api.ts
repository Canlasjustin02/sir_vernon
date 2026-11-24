import { apiFetch } from "../../../services/http/interceptors";
import type { PendingTransferData } from "./bankTransferVerification.api";

export const getBankTransfers = async (params: { status?: string; search?: string } = {}) => {
  const query = new URLSearchParams();
  if (params.status && params.status !== "All Transactions") query.append("status", params.status);
  if (params.search) query.append("search", params.search);

  const queryString = query.toString() ? `?${query.toString()}` : "";
  return apiFetch<PendingTransferData[]>(`/payments/bank-transfer${queryString}`);
};
