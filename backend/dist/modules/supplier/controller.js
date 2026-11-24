import { ApiResponse } from '../../core/apiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';
import * as supplierService from './service.js';
export const createSupplier = asyncHandler(async (req, res) => {
    const supplier = await supplierService.createSupplier(req.body);
    return ApiResponse(res, 201, 'Supplier created successfully', supplier);
});
export const getSuppliers = asyncHandler(async (req, res) => {
    const result = await supplierService.getSuppliers(req.query);
    return ApiResponse(res, 200, 'Suppliers retrieved successfully', result);
});
export const getSupplierById = asyncHandler(async (req, res) => {
    const supplier = await supplierService.getSupplierById(req.params.id);
    return ApiResponse(res, 200, 'Supplier retrieved successfully', supplier);
});
export const updateSupplier = asyncHandler(async (req, res) => {
    const supplier = await supplierService.updateSupplier(req.params.id, req.body);
    return ApiResponse(res, 200, 'Supplier updated successfully', supplier);
});
export const deleteSupplier = asyncHandler(async (req, res) => {
    await supplierService.deleteSupplier(req.params.id);
    return ApiResponse(res, 200, 'Supplier deleted successfully');
});
export const getSupplierStats = asyncHandler(async (_req, res) => {
    const stats = await supplierService.getSupplierStats();
    return ApiResponse(res, 200, 'Supplier stats retrieved successfully', stats);
});
