import * as service from './loyalty.service.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../core/apiResponse.js';
export const getStatus = asyncHandler(async (req, res) => {
    const result = await service.getLoyaltyStatus(req.user.id);
    return ApiResponse(res, 200, 'Loyalty status fetched', result);
});
export const getHistory = asyncHandler(async (req, res) => {
    const result = await service.getLoyaltyHistory(req.user.id);
    return ApiResponse(res, 200, 'Loyalty history fetched', result);
});
export const getTiers = asyncHandler(async (req, res) => {
    const result = await service.getAllTiers();
    return ApiResponse(res, 200, 'Loyalty tiers fetched', result);
});
export const getCustomerLoyalty = asyncHandler(async (req, res) => {
    const result = await service.getCustomerLoyaltyRecords();
    return ApiResponse(res, 200, 'Customer loyalty records fetched', result);
});
export const updateTier = asyncHandler(async (req, res) => {
    const result = await service.updateLoyaltyTier(req.params.id, req.body);
    return ApiResponse(res, 200, 'Loyalty tier updated successfully', result);
});
export const getAllTransactions = asyncHandler(async (req, res) => {
    const result = await service.getAllLoyaltyTransactions();
    return ApiResponse(res, 200, 'All loyalty transactions fetched', result);
});
