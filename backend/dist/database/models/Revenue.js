import mongoose from 'mongoose';
import { createTenantModel } from '../tenantContext.js';
const revenueSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    date: {
        type: Date,
        required: true,
    },
    sourceType: {
        type: String,
        required: true,
        trim: true,
    },
}, {
    timestamps: true,
});
export default createTenantModel('Revenue', revenueSchema);
