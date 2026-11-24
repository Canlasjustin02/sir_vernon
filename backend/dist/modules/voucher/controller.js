import * as service from './service.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../core/apiResponse.js';
export const createVoucher = asyncHandler(async (req, res) => {
    const data = await service.createVoucher(req.body);
    return ApiResponse(res, 201, 'Voucher created successfully', data);
});
export const updateVoucher = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = await service.updateVoucher(id, req.body);
    return ApiResponse(res, 200, 'Voucher updated successfully', data);
});
export const deleteVoucher = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await service.deleteVoucher(id);
    return ApiResponse(res, 200, 'Voucher deleted successfully');
});
export const getAllVouchers = asyncHandler(async (req, res) => {
    const data = await service.getAllVouchers(req.query);
    return ApiResponse(res, 200, 'Vouchers fetched successfully', data);
});
export const getVoucherByCode = asyncHandler(async (req, res) => {
    const { code } = req.params;
    const data = await service.getVoucherByCode(code);
    return ApiResponse(res, 200, 'Voucher fetched successfully', data);
});
export const validateVoucher = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { code, orderAmount } = req.body;
    const data = await service.validateVoucher(code, userId, Number(orderAmount));
    return ApiResponse(res, 200, 'Voucher is valid', data);
});
export const redeemVoucher = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { voucherId, orderId } = req.body;
    const data = await service.redeemVoucher(voucherId, userId, orderId);
    return ApiResponse(res, 201, 'Voucher redeemed successfully', data);
});
export const applyToOrder = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { orderId, voucherCode } = req.body;
    const data = await service.applyVoucherToOrder(orderId, userId, voucherCode);
    return ApiResponse(res, 200, 'Voucher applied to order successfully', data);
});
