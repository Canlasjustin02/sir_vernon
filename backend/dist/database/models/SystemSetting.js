import mongoose from 'mongoose';
import { createTenantModel } from '../tenantContext.js';
const systemSettingSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    description: {
        type: String
    }
}, { timestamps: true });
export default createTenantModel('SystemSetting', systemSettingSchema);
