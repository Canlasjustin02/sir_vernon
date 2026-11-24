import asyncHandler from '../../../utils/asyncHandler.js';
import { initBankTransferPayment, initCODPayment, initCardPayment, getAllPayments, adminVerifyPayment } from '../service/payment.service.js';
import { ApiResponse } from '../../../core/apiResponse.js';
import ApiError from '../../../core/apiError.js';
export const initBankTransfer = asyncHandler(async (req, res) => {
    const orderId = String(req.params.orderId);
    const userId = req.user?.id;
    const data = await initBankTransferPayment(orderId, userId);
    return ApiResponse(res, 201, 'Bank transfer initiated', data);
});
export const initCOD = asyncHandler(async (req, res) => {
    const orderId = String(req.params.orderId);
    const userId = req.user?.id;
    const data = await initCODPayment(orderId, userId);
    return ApiResponse(res, 201, 'COD payment initiated', data);
});
export const initCard = asyncHandler(async (req, res) => {
    const orderId = String(req.params.orderId);
    const userId = req.user?.id;
    const { saveCard } = req.body;
    const data = await initCardPayment(orderId, userId, saveCard);
    return ApiResponse(res, 201, 'Card payment initiated successfully', data);
});
export const getPayments = asyncHandler(async (req, res) => {
    const status = req.query.status;
    const payments = await getAllPayments({ status });
    return ApiResponse(res, 200, 'Payments fetched successfully', payments);
});
export const verifyPayment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!['PAID', 'FAILED'].includes(status)) {
        throw new ApiError(400, 'Invalid status. Use PAID or FAILED');
    }
    const payment = await adminVerifyPayment(id, status);
    return ApiResponse(res, 200, `Payment ${status.toLocaleLowerCase()} successfully`, payment);
});
