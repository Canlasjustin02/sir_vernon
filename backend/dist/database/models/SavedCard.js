import mongoose from 'mongoose';
import { createTenantModel } from '../tenantContext.js';
const savedCardSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    provider: {
        type: String,
        required: true,
        trim: true,
    },
    cardToken: {
        type: String,
        required: true,
        trim: true,
    },
    last4: {
        type: String,
        required: true,
        trim: true,
    },
    brand: {
        type: String,
        default: null,
        trim: true,
    },
    expiryMonth: {
        type: Number,
        required: true,
        min: 1,
        max: 12,
    },
    expiryYear: {
        type: Number,
        required: true,
    },
    isDefault: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});
export default createTenantModel('SavedCard', savedCardSchema);
