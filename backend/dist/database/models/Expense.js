import mongoose from 'mongoose';
import { createTenantModel } from '../tenantContext.js';
const expenseSchema = new mongoose.Schema({
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
}, {
    timestamps: true,
});
export default createTenantModel('Expense', expenseSchema);
