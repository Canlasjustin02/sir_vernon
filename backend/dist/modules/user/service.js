import User from '../../database/models/User.js';
import { hashPassword, comparePassword } from '../../utils/password.js';
export const getProfile = async (userId) => {
    const user = await User.findById(userId).select('-password -refreshToken');
    if (!user) {
        throw new Error('User not found');
    }
    return user;
};
export const updateProfile = async (userId, updateData) => {
    if (updateData.email) {
        const existingUser = await User.findOne({ email: updateData.email, _id: { $ne: userId } });
        if (existingUser) {
            throw new Error('Email already in use by another account');
        }
    }
    const user = await User.findByIdAndUpdate(userId, { $set: updateData }, { returnDocument: 'after', runValidators: true }).select('-password -refreshToken');
    if (!user) {
        throw new Error('User not found');
    }
    return user;
};
export const changePassword = async (userId, { currentPassword, newPassword }) => {
    const user = await User.findById(userId);
    if (!user)
        throw new Error('User not found');
    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch)
        throw new Error('Current password does not match');
    user.password = await hashPassword(newPassword);
    await user.save();
    return true;
};
export const getUsers = async (filters) => {
    const query = {};
    if (filters.role) {
        query.role = filters.role;
    }
    if (filters.viewerRole === 'ADMIN') {
        if (filters.role === 'ADMIN') {
            query._id = filters.viewerId;
        }
        else if (filters.role === 'STAFF') {
            query.shopOwnerId = filters.viewerId;
        }
        else if (!filters.role) {
            query.$or = [
                { role: 'CUSTOMER' },
                { _id: filters.viewerId },
                { shopOwnerId: filters.viewerId },
            ];
        }
    }
    if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
    }
    if (filters.search) {
        const searchConditions = [
            { name: { $regex: filters.search, $options: 'i' } },
            { email: { $regex: filters.search, $options: 'i' } },
            { telephone: { $regex: filters.search, $options: 'i' } },
        ];
        if (query.$or) {
            query.$and = [{ $or: query.$or }, { $or: searchConditions }];
            delete query.$or;
        }
        else {
            query.$or = searchConditions;
        }
    }
    return await User.find(query).select('-password -refreshToken').sort({ createdAt: -1 });
};
export const createUser = async (userData, shopOwnerId) => {
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
        throw new Error('Email already exists');
    }
    const hashedPassword = await hashPassword(userData.password);
    const user = await User.create({
        ...userData,
        password: hashedPassword,
        shopOwnerId: userData.role === 'STAFF' ? shopOwnerId : null,
    });
    const result = user.toObject();
    delete result.password;
    delete result.refreshToken;
    return result;
};
export const getUserById = async (id, viewerId) => {
    const user = await User.findById(id).select('-password -refreshToken');
    if (!user) {
        throw new Error('User not found');
    }
    if (viewerId &&
        user.role === 'STAFF' &&
        user.shopOwnerId?.toString() !== viewerId) {
        throw new Error('User not found');
    }
    if (viewerId && user.role === 'ADMIN' && user._id.toString() !== viewerId) {
        throw new Error('User not found');
    }
    return user;
};
export const updateAnyUser = async (id, updateData, viewerId) => {
    const existingUser = await User.findById(id);
    if (!existingUser)
        throw new Error('User not found');
    if (viewerId &&
        existingUser.role === 'STAFF' &&
        existingUser.shopOwnerId?.toString() !== viewerId) {
        throw new Error('User not found');
    }
    if (viewerId &&
        existingUser.role === 'ADMIN' &&
        existingUser._id.toString() !== viewerId) {
        throw new Error('User not found');
    }
    if (viewerId && existingUser.role === 'CUSTOMER' && updateData.role === 'ADMIN') {
        throw new Error('Cannot promote a customer account to admin');
    }
    if (updateData.password) {
        updateData.password = await hashPassword(updateData.password);
    }
    if (updateData.role === 'STAFF' && existingUser.role !== 'STAFF') {
        updateData.shopOwnerId = viewerId ?? null;
    }
    else if (updateData.role === 'CUSTOMER') {
        updateData.shopOwnerId = null;
    }
    const user = await User.findByIdAndUpdate(id, { $set: updateData }, { returnDocument: 'after', runValidators: true }).select('-password -refreshToken');
    if (!user) {
        throw new Error('User not found');
    }
    return user;
};
export const softDeleteUser = async (id, viewerId) => {
    if (viewerId)
        await getUserById(id, viewerId);
    const user = await User.findByIdAndUpdate(id, { $set: { isActive: false } }, { returnDocument: 'after' }).select('-password -refreshToken');
    if (!user) {
        throw new Error('User not found');
    }
    return user;
};
