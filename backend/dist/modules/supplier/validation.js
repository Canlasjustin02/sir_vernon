import mongoose from 'mongoose';
import ApiError from '../../core/apiError.js';
export const validateCreateSupplier = (req, _res, next) => {
    const { name, contactPerson, email, phone, address, category } = req.body;
    if (!name)
        return next(new ApiError(422, 'Name is required'));
    if (!contactPerson)
        return next(new ApiError(422, 'Contact person is required'));
    if (!email)
        return next(new ApiError(422, 'Email is required'));
    if (!phone)
        return next(new ApiError(422, 'Phone is required'));
    if (!address)
        return next(new ApiError(422, 'Address is required'));
    if (!category)
        return next(new ApiError(422, 'Category is required'));
    next();
};
export const validateSupplierId = (req, _res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return next(new ApiError(422, 'Invalid supplier ID'));
    }
    next();
};
export const validateUpdateSupplier = (req, _res, next) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
        return next(new ApiError(422, 'Invalid supplier ID'));
    }
    next();
};
