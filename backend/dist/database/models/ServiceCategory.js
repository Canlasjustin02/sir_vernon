import mongoose from 'mongoose';
import { createTenantModel } from '../tenantContext.js';
const serviceCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    price: {
        type: Number,
        default: 0,
        min: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});
export default createTenantModel('ServiceCategory', serviceCategorySchema);
