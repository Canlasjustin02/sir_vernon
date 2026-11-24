import { ApiResponse } from '../../core/apiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';
import * as feedbackService from './service.js';
export const createFeedback = asyncHandler(async (req, res) => {
    const { orderId, rating, comment, suggestions, tags } = req.body;
    const feedback = await feedbackService.createFeedback(req.user.id, {
        orderId,
        rating,
        comment,
        suggestions,
        tags,
    });
    return ApiResponse(res, 201, 'Feedback submitted successfully', feedback);
});
export const updateMyFeedbackController = asyncHandler(async (req, res) => {
    const { rating, comment, suggestions, tags } = req.body;
    const feedback = await feedbackService.updateMyFeedback(req.user.id, req.params.id, {
        rating,
        comment,
        suggestions,
        tags,
    });
    return ApiResponse(res, 200, 'Feedback updated successfully', feedback);
});
export const deleteMyFeedbackController = asyncHandler(async (req, res) => {
    const result = await feedbackService.deleteMyFeedback(req.user.id, req.params.id);
    return ApiResponse(res, 200, 'Feedback deleted successfully', result);
});
export const getMyFeedbackForOrder = asyncHandler(async (req, res) => {
    const feedback = await feedbackService.getMyFeedbackForOrder(req.user.id, req.params.orderId);
    return ApiResponse(res, 200, 'Feedback retrieved successfully', feedback);
});
export const getAllFeedbacks = asyncHandler(async (req, res) => {
    const result = await feedbackService.getAllFeedbacks(req.query);
    return ApiResponse(res, 200, 'Feedbacks retrieved successfully', result);
});
export const getFeedbackById = asyncHandler(async (req, res) => {
    const feedback = await feedbackService.getFeedbackById(req.params.id);
    return ApiResponse(res, 200, 'Feedback retrieved successfully', feedback);
});
export const updateFeedbackStatus = asyncHandler(async (req, res) => {
    const feedback = await feedbackService.updateFeedbackStatus(req.params.id, req.body.status);
    return ApiResponse(res, 200, 'Feedback status updated successfully', feedback);
});
export const getFeedbackStats = asyncHandler(async (_req, res) => {
    const stats = await feedbackService.getFeedbackStats();
    return ApiResponse(res, 200, 'Feedback stats retrieved successfully', stats);
});
export const deleteFeedbackAdminController = asyncHandler(async (req, res) => {
    const result = await feedbackService.deleteFeedbackAdmin(req.params.id);
    return ApiResponse(res, 200, 'Feedback deleted successfully by Admin', result);
});
export const getApprovedFeedbacks = asyncHandler(async (req, res) => {
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const feedbacks = await feedbackService.getApprovedFeedbacks(limit);
    return ApiResponse(res, 200, 'Approved feedbacks retrieved successfully', feedbacks);
});
export const getMyAllFeedbacksController = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const feedbacks = await feedbackService.getMyAllFeedbacks(userId);
    return ApiResponse(res, 200, 'My feedbacks retrieved successfully', feedbacks);
});
export const getFeedbackSummary = asyncHandler(async (req, res) => {
    const summary = await feedbackService.getFeedbackSummary();
    return ApiResponse(res, 200, 'Feedback summary generated successfully', summary);
});
