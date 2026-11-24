import ServiceCategory from '../../database/models/ServiceCategory.js';
import ApiError from '../../core/apiError.js';
export const createCategory = async (input) => {
    return await ServiceCategory.create(input);
};
export const updateCategory = async (id, input) => {
    const category = await ServiceCategory.findByIdAndUpdate(id, { $set: input }, { new: true, runValidators: true });
    if (!category) {
        throw new ApiError(404, 'Category not found');
    }
    return category;
};
export const deleteCategory = async (id) => {
    const result = await ServiceCategory.findByIdAndDelete(id);
    if (!result) {
        throw new ApiError(404, 'Category not found');
    }
    return { success: true };
};
export const getCategoryById = async (id) => {
    const category = await ServiceCategory.findById(id);
    if (!category) {
        throw new ApiError(404, 'Category not found');
    }
    return category;
};
export const getAllCategories = async () => {
    return await ServiceCategory.find().sort({ name: 1 });
};
