import asyncHandler from '../../../utils/asyncHandler.js';
import { getFilteredOnlineTransactions } from '../service/onlineTransaction.service.js';
import { ApiResponse } from '../../../core/apiResponse.js';
export const getOnlineTransactionsHandler = asyncHandler(async (req, res) => {
    res.set('Cache-Control', 'no-store');
    const { status, search } = req.query;
    const result = await getFilteredOnlineTransactions(status, search);
    return ApiResponse(res, 200, 'Online transactions fetched successfully', result);
});
