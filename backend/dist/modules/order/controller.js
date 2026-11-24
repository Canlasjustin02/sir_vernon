import * as service from './service.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../core/apiResponse.js';
export const createOrder = asyncHandler(async (req, res) => {
    const result = await service.createOrder(req.user.id, req.body);
    return ApiResponse(res, 201, 'Order created successfully', result);
});
export const updateOrderStatus = asyncHandler(async (req, res) => {
    const result = await service.updateOrderStatus(req.params.id, req.body.status, req.user.id, req.user.role);
    return ApiResponse(res, 200, 'Order status updated successfully', result);
});
export const claimOrder = asyncHandler(async (req, res) => {
    const result = await service.claimOrder(req.params.id, req.user.id, req.user.role);
    return ApiResponse(res, 200, 'Order claimed successfully', result);
});
export const getAvailableOrders = asyncHandler(async (req, res) => {
    const result = await service.getAvailableOrders(req.query, req.user.id, req.user.role);
    return ApiResponse(res, 200, 'Available orders fetched successfully', result);
});
export const getStaffTasks = asyncHandler(async (req, res) => {
    const result = await service.getStaffTasks(req.user.id, req.query);
    return ApiResponse(res, 200, 'Staff tasks fetched successfully', result);
});
export const notifyArrival = asyncHandler(async (req, res) => {
    const result = await service.notifyArrival(req.params.id, req.user.id);
    return ApiResponse(res, 200, 'Arrival notification sent successfully', result);
});
export const getOrderById = asyncHandler(async (req, res) => {
    const result = await service.getOrderById(req.params.id, req.user.id, req.user.role);
    return ApiResponse(res, 200, 'Order fetched successfully', result);
});
export const getMyOrders = asyncHandler(async (req, res) => {
    const result = await service.getMyOrders(req.user.id, req.query);
    return ApiResponse(res, 200, 'My orders fetched successfully', result);
});
export const getAllOrders = asyncHandler(async (req, res) => {
    const result = await service.getAllOrders(req.query, req.user.id, req.user.role);
    return ApiResponse(res, 200, 'All orders fetched successfully', result);
});
export const downloadReceipt = asyncHandler(async (req, res) => {
    const buffer = await service.generateReceiptPdf(req.params.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt-${req.params.id}.pdf`);
    return res.status(200).send(buffer);
});
export const cancelOrder = asyncHandler(async (req, res) => {
    const result = await service.cancelOrder(req.params.id, req.user.id);
    return ApiResponse(res, 200, 'Order cancelled successfully', result);
});
export const updateOrder = asyncHandler(async (req, res) => {
    const result = await service.updateAnyOrder(req.params.id, req.body, req.user.id, req.user.role);
    return ApiResponse(res, 200, 'Order updated successfully', result);
});
export const deleteOrder = asyncHandler(async (req, res) => {
    await service.softDeleteOrder(req.params.id, req.user.id, req.user.role);
    return ApiResponse(res, 200, 'Order deleted successfully (Soft delete)');
});
