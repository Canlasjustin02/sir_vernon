import mongoose from 'mongoose';
import { createTenantModel } from '../tenantContext.js';
const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    message: {
        type: String,
        required: true,
        trim: true,
    },
    type: {
        type: String,
        enum: ['ORDER_UPDATE', 'PROMOTION', 'SYSTEM', 'PAYMENT'],
        default: 'SYSTEM',
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    data: {
        type: Object,
        default: null,
    },
}, {
    timestamps: true,
});
export default createTenantModel('Notification', notificationSchema);
