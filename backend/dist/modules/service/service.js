import Service from '../../database/models/Service.js';
import ServiceCategory from '../../database/models/ServiceCategory.js';
import ApiError from '../../core/apiError.js';
import { getCurrentShopOwnerId } from '../../database/tenantContext.js';
export const createService = async (input) => {
    const service = await Service.create(input);
    return service;
};
export const updateService = async (id, input) => {
    const service = await Service.findByIdAndUpdate(id, { $set: input }, { new: true, runValidators: true });
    if (!service) {
        throw new ApiError(404, 'Service not found');
    }
    return service;
};
export const deleteService = async (id) => {
    const result = await Service.findByIdAndDelete(id);
    if (!result) {
        throw new ApiError(404, 'Service not found');
    }
    return { success: true };
};
export const getServiceById = async (id) => {
    const service = await Service.findById(id).populate('categoryId', 'name');
    if (!service) {
        throw new ApiError(404, 'Service not found');
    }
    return service;
};
export const getAllServices = async (query) => {
    const { category, page = 1, limit = 10 } = query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const filter = {};
    if (category && category !== 'All') {
        const cat = await ServiceCategory.findOne({ name: category });
        if (cat) {
            filter.categoryId = cat._id;
        }
        else {
            return { items: [], pagination: { total: 0, page: pageNum, limit: limitNum, totalPages: 0 } };
        }
    }
    const total = await Service.countDocuments(filter);
    const items = await Service
        .find(filter)
        .populate('categoryId', 'name')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum);
    const mapped = items.map((s) => ({
        ...s.toObject(),
        category: s.categoryId?.name ?? '',
    }));
    return {
        items: mapped,
        pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
        },
    };
};
export const getServicesByCategory = async (categoryId) => {
    return await Service.find({ categoryId }).sort({ name: 1 });
};
export const getManagedServices = async (query) => {
    const result = await getAllServices(query);
    const ownerId = getCurrentShopOwnerId();
    return {
        ...result,
        items: result.items.map((service) => ({
            ...service,
            ownerId,
        })),
    };
};
