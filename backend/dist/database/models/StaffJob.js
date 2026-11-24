import mongoose from 'mongoose';
import { createTenantModel } from '../tenantContext.js';
const staffJobSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
    },
    jobType: {
        type: String,
        required: true,
        trim: true,
    },
    assignedStaffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    jobStatus: {
        type: String,
        required: true,
        trim: true,
    },
    startedAt: {
        type: Date,
        default: null,
    },
    completedAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});
export default createTenantModel('StaffJob', staffJobSchema);
