import mongoose from 'mongoose';
import { createTenantModel } from '../tenantContext.js';
const voucherRedemptionSchema = new mongoose.Schema({
    voucherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Voucher',
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
    },
    redeemedAt: {
        type: Date,
        default: Date.now,
    },
    discountAmount: {
        type: Number,
        required: true,
        min: 0,
    },
}, {
    timestamps: true,
});
export default createTenantModel('VoucherRedemption', voucherRedemptionSchema);
