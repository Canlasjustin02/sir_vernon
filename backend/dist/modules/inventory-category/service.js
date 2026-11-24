import InventoryCategory from '../../database/models/InventoryCategory.js';
import ApiError from '../../core/apiError.js';
export const createCategory = async (input) => {
    return await InventoryCategory.create(input);
};
export const updateCategory = async (id, input) => {
    const category = await InventoryCategory.findByIdAndUpdate(id, { $set: input }, { new: true, runValidators: true });
    if (!category) {
        throw new ApiError(404, 'Inventory Category not found');
    }
    return category;
};
export const deleteCategory = async (id) => {
    const result = await InventoryCategory.findByIdAndDelete(id);
    if (!result) {
        throw new ApiError(404, 'Inventory Category not found');
    }
    return { success: true };
};
export const getCategoryById = async (id) => {
    const category = await InventoryCategory.findById(id);
    if (!category) {
        throw new ApiError(404, 'Inventory Category not found');
    }
    return category;
};
export const getAllCategories = async () => {
    return await InventoryCategory.find().sort({ name: 1 });
};
