import mongoose from 'mongoose';
import { createTenantModel } from '../tenantContext.js';
const loyaltyTierSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
    },
    minPoints: {
        type: Number,
        required: true,
        min: 0,
    },
    discountType: {
        type: String,
        enum: ['PERCENTAGE', 'FIXED'],
        default: 'PERCENTAGE',
    },
    discountValue: {
        type: Number,
        required: true,
        min: 0,
    },
    perks: {
        type: [String],
        default: [],
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});
export default createTenantModel('LoyaltyTier', loyaltyTierSchema);
