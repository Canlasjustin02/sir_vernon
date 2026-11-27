import mongoose from 'mongoose';
import PDFDocument from 'pdfkit';
import Order from '../../database/models/Order.js';
import Service from '../../database/models/Service.js';
import Inventory from '../../database/models/Inventory.js';
import CashOnDelivery from '../../database/models/CashOnDelivery.js';
import Payment from '../../database/models/Payment.js';
import User from '../../database/models/User.js';
import ApiError from '../../core/apiError.js';
import { PAYMENT_STATUS, ORDER_STATUS, DEFAULT_PAGINATION, LOYALTY_RULES, NOTIFICATION_TYPES, PAYMENT_METHODS, ROLES, LOGISTICS_JOB_TYPES, DISCOUNT_TYPE } from '../../core/constants.js';
import { generateOrderNo } from '../../utils/reference.js';
import * as voucherService from '../voucher/service.js';
import * as loyaltyService from '../loyalty/loyalty.service.js';
import { createNotification } from '../notification/service.js';
export const createOrder = async (userId, input) => {
    const service = await Service.findById(input.serviceId);
    if (!service) {
        throw new ApiError(404, 'Service not found');
    }
    const shopOwner = input.shopOwnerId
        ? await User.findOne({ _id: input.shopOwnerId, role: ROLES.ADMIN, isActive: true })
        : null;
    if (input.shopOwnerId && !shopOwner) {
        throw new ApiError(404, 'Laundry shop not found');
    }
    const subtotal = service.price * (input.weightKg || 1);
    let extraFromOptions = 0;
    const selectedOptions = [];
    if (input.options && input.options.length > 0) {
        const inventoryItems = await Inventory.find({
            _id: { $in: input.options },
            isActive: true,
        });
        for (const item of inventoryItems) {
            if (!item.isDefault) {
                extraFromOptions += item.unitPrice;
            }
            selectedOptions.push({
                inventoryId: item._id,
                name: item.name,
                price: item.isDefault ? 0 : item.unitPrice,
                categoryName: item.categoryName,
            });
        }
    }
    const extraFee = (input.extraFee || 0) + extraFromOptions;
    const deliveryFee = input.deliveryFee || 0;
    const totalAmount = subtotal + extraFee + deliveryFee;
    let orderNo = generateOrderNo();
    let exists = await Order.exists({ orderNo });
    while (exists) {
        orderNo = generateOrderNo();
        exists = await Order.exists({ orderNo });
    }
    const order = await Order.create({
        orderNo,
        userId,
        shopOwnerId: shopOwner?._id ?? null,
        serviceId: input.serviceId,
        serviceMode: input.serviceMode || 'PICKUP_DELIVERY',
        weightKg: input.weightKg,
        status: ORDER_STATUS.ORDER_PLACED,
        reservedDateTime: input.reservedDateTime,
        pickupAddress: input.pickupAddress,
        deliveryAddress: input.deliveryAddress,
        pickupLat: input.pickupLat,
        pickupLng: input.pickupLng,
        deliveryLat: input.deliveryLat,
        deliveryLng: input.deliveryLng,
        notes: input.notes,
        subtotal,
        extraFee,
        deliveryFee,
        totalAmount,
        paymentMethod: input.paymentMethod,
        paymentStatus: PAYMENT_STATUS.PENDING,
        options: selectedOptions,
    });
    if (order.paymentMethod !== PAYMENT_METHODS.NONE) {
        try {
            const recipients = shopOwner ? [shopOwner] : await User.find({ role: ROLES.ADMIN });
            for (const admin of recipients) {
                await createNotification(admin._id.toString(), {
                    title: 'New Order Received',
                    message: `A new order ${order.orderNo} has been placed by a customer.`,
                    type: NOTIFICATION_TYPES.ORDER_UPDATE,
                    data: { orderId: order._id }
                });
            }
        }
        catch (e) {
            console.error('Failed to notify admins:', e);
        }
    }
    return order;
};
export const claimOrder = async (orderId, staffId, role) => {
    const order = await Order.findById(orderId);
    if (!order)
        throw new ApiError(404, 'Order not found');
    if (role === ROLES.ADMIN && order.shopOwnerId?.toString() !== staffId) {
        throw new ApiError(404, 'Order not found');
    }
    if (order.staffId) {
        throw new ApiError(400, 'Order already assigned to another rider');
    }
    let nextStatus = order.status;
    if (order.status === ORDER_STATUS.ORDER_PLACED) {
        nextStatus = ORDER_STATUS.PICKUP_ASSIGNED;
    }
    else if (order.status === ORDER_STATUS.READY) {
        nextStatus = ORDER_STATUS.DELIVERY_ASSIGNED;
    }
    const staffIdObj = new mongoose.Types.ObjectId(staffId);
    order.staffId = staffIdObj;
    order.status = nextStatus;
    await order.save();
    try {
        const jobType = nextStatus === ORDER_STATUS.PICKUP_ASSIGNED ? LOGISTICS_JOB_TYPES.PICKUP : LOGISTICS_JOB_TYPES.DELIVERY;
        const { createJobFromOrder } = await import('./delivery.service.js');
        await createJobFromOrder(order._id.toString(), staffId, jobType);
    }
    catch (e) {
        console.error('Failed to create logistics job track:', e);
    }
    return order;
};
export const getAvailableOrders = async (query, ownerId, role) => {
    const { page, limit } = query;
    const p = parseInt(page) || DEFAULT_PAGINATION.PAGE;
    const l = parseInt(limit) || DEFAULT_PAGINATION.LIMIT;
    const skip = (p - 1) * l;
    const filter = {
        staffId: null,
        status: { $in: [ORDER_STATUS.ORDER_PLACED, ORDER_STATUS.READY] },
        isActive: true,
        $or: [
            { paymentMethod: PAYMENT_METHODS.COD },
            { paymentStatus: PAYMENT_STATUS.PAID }
        ],
        paymentMethod: { $ne: PAYMENT_METHODS.NONE }
    };
    if (role === ROLES.ADMIN)
        filter.shopOwnerId = ownerId;
    const [orders, total] = await Promise.all([
        Order.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(l)
            .populate('userId', 'name telephone')
            .populate('serviceId', 'name'),
        Order.countDocuments(filter),
    ]);
    return {
        orders,
        pagination: {
            total,
            page: p,
            limit: l,
            totalPages: Math.ceil(total / l),
        },
    };
};
export const getStaffTasks = async (staffId, query) => {
    const { status, page, limit } = query;
    const p = parseInt(page) || DEFAULT_PAGINATION.PAGE;
    const l = parseInt(limit) || DEFAULT_PAGINATION.LIMIT;
    const skip = (p - 1) * l;
    const filter = { staffId };
    if (status) {
        if (Array.isArray(status)) {
            filter.status = { $in: status };
        }
        else {
            filter.status = status;
        }
    }
    const [orders, total] = await Promise.all([
        Order.find(filter)
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(l)
            .populate('userId', 'name telephone')
            .populate('serviceId', 'name'),
        Order.countDocuments(filter),
    ]);
    return {
        orders,
        pagination: {
            total,
            page: p,
            limit: l,
            totalPages: Math.ceil(total / l),
        },
    };
};
export const notifyArrival = async (orderId, staffId) => {
    const order = await Order.findById(orderId);
    if (!order)
        throw new ApiError(404, 'Order not found');
    try {
        let nextStatus = ORDER_STATUS.PICKUP_ARRIVED;
        if (order.status === ORDER_STATUS.DELIVERY_ASSIGNED || order.status === ORDER_STATUS.DELIVERY_ON_THE_WAY) {
            nextStatus = ORDER_STATUS.DELIVERY_ARRIVED;
        }
        order.status = nextStatus;
        await order.save();
        await createNotification(order.userId.toString(), {
            title: 'Staff Member Arrived!',
            message: `Our staff member has arrived at your location for order #${order.orderNo}. Please be ready for pickup/delivery.`,
            type: NOTIFICATION_TYPES.ORDER_UPDATE,
            data: {
                orderId: order._id,
                status: nextStatus,
                orderNo: order.orderNo
            }
        });
    }
    catch (e) {
        console.error('Failed to send arrival notification:', e);
        throw new ApiError(500, 'Failed to send notification');
    }
    return { success: true };
};
export const updateOrderStatus = async (id, status, updateBy, role) => {
    const updateData = { status, updateBy };
    const orderToUpdate = await Order.findById(id);
    if (!orderToUpdate)
        throw new ApiError(404, 'Order not found');
    if (role === ROLES.ADMIN && orderToUpdate.shopOwnerId?.toString() !== updateBy) {
        throw new ApiError(404, 'Order not found');
    }
    const isSelfServiceDropOff = orderToUpdate.serviceMode === 'SELF_SERVICE';
    if ((status === ORDER_STATUS.PICKED_UP ||
        (isSelfServiceDropOff && status === ORDER_STATUS.HANDED_OVER)) &&
        orderToUpdate.paymentMethod === PAYMENT_METHODS.COD) {
        updateData.paymentStatus = PAYMENT_STATUS.PAID;
        updateData.paidAt = new Date();
        try {
            await CashOnDelivery.findOneAndUpdate({ orderId: id }, {
                $set: {
                    status: PAYMENT_STATUS.PAID,
                    collectedBy: updateBy,
                    collectedAt: new Date()
                }
            });
            await Payment.findOneAndUpdate({ orderId: id, method: PAYMENT_METHODS.COD }, {
                $set: {
                    status: PAYMENT_STATUS.PAID,
                    paidAt: new Date()
                }
            });
            await loyaltyService.awardLoyaltyPoints(orderToUpdate.userId.toString(), 10, orderToUpdate._id.toString());
        }
        catch (e) {
            console.error('Failed to update COD financial records:', e);
        }
    }
    if (status === ORDER_STATUS.HANDED_OVER) {
        updateData.staffId = isSelfServiceDropOff ? updateBy : null;
    }
    else if (isSelfServiceDropOff && status === ORDER_STATUS.DELIVERED) {
        updateData.staffId = updateBy;
    }
    const order = await Order.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    if (!order) {
        throw new ApiError(404, 'Order not found');
    }
    try {
        await createNotification(order.userId.toString(), {
            title: `Order Status Updated: ${order.orderNo}`,
            message: `Your order status has been updated to ${order.status}.`,
            type: NOTIFICATION_TYPES.ORDER_UPDATE,
            data: { orderId: order._id, status: order.status }
        });
    }
    catch (e) {
        console.error('Failed to create notification:', e);
    }
    if (status === ORDER_STATUS.DELIVERED) {
        try {
            const { deductStockForOrder } = await import('../inventory/service.js');
            await deductStockForOrder(order._id.toString(), order.serviceId.toString(), order.options, order.weightKg || 1);
        }
        catch (e) {
            console.error('Failed to deduct stock on delivery:', e);
        }
        try {
            await loyaltyService.awardLoyaltyPoints(order.userId.toString(), LOYALTY_RULES.POINTS_PER_ORDER || 10, order._id.toString());
        }
        catch (e) {
            console.error('Failed to award loyalty points:', e);
        }
    }
    return order;
};
export const cancelOrder = async (id, userId) => {
    const order = await Order.findOne({ _id: id, userId });
    if (!order) {
        throw new ApiError(404, 'Order not found');
    }
    if (order.status === ORDER_STATUS.CANCELLED ||
        order.status === ORDER_STATUS.DELIVERED ||
        order.status === ORDER_STATUS.HANDED_OVER) {
        throw new ApiError(400, 'Order cannot be cancelled at this stage');
    }
    if (order.paymentMethod === PAYMENT_METHODS.COD && order.status !== ORDER_STATUS.ORDER_PLACED) {
        throw new ApiError(400, 'Order already being processed and cannot be cancelled');
    }
    if (order.paymentStatus === PAYMENT_STATUS.PAID && order.status !== ORDER_STATUS.ORDER_PLACED) {
        throw new ApiError(400, 'Paid orders in progress cannot be cancelled');
    }
    order.status = ORDER_STATUS.CANCELLED;
    await order.save();
    return order;
};
export const getOrderById = async (id, userId, role) => {
    const order = await Order.findById(id)
        .populate('userId', 'name email telephone')
        .populate('serviceId', 'name price');
    if (!order || (role === ROLES.ADMIN && order.shopOwnerId?.toString() !== userId)) {
        throw new ApiError(404, 'Order not found');
    }
    return order;
};
export const getMyOrders = async (userId, query) => {
    const { status, page, limit } = query;
    const p = parseInt(page) || DEFAULT_PAGINATION.PAGE;
    const l = parseInt(limit) || DEFAULT_PAGINATION.LIMIT;
    const skip = (p - 1) * l;
    const filter = { userId };
    if (status)
        filter.status = status;
    if (query.excludeStatus) {
        if (Array.isArray(query.excludeStatus)) {
            filter.status = { ...filter.status, $nin: query.excludeStatus };
        }
        else {
            filter.status = { ...filter.status, $ne: query.excludeStatus };
        }
    }
    const [orders, total] = await Promise.all([
        Order.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(l)
            .populate('serviceId', 'name'),
        Order.countDocuments(filter),
    ]);
    return {
        orders,
        pagination: {
            total,
            page: p,
            limit: l,
            totalPages: Math.ceil(total / l),
        },
    };
};
export const getAllOrders = async (query, ownerId, role) => {
    const { status, userId, page, limit } = query;
    const p = parseInt(page) || DEFAULT_PAGINATION.PAGE;
    const l = parseInt(limit) || DEFAULT_PAGINATION.LIMIT;
    const skip = (p - 1) * l;
    const filter = { isActive: true };
    if (role === ROLES.ADMIN)
        filter.shopOwnerId = ownerId;
    if (status)
        filter.status = status;
    if (userId)
        filter.userId = userId;
    const [orders, total] = await Promise.all([
        Order.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(l)
            .populate('userId', 'name')
            .populate('serviceId', 'name')
            .populate('shopOwnerId', 'name address telephone'),
        Order.countDocuments(filter),
    ]);
    return {
        orders,
        pagination: {
            total,
            page: p,
            limit: l,
            totalPages: Math.ceil(total / l),
        },
    };
};
export const applyVoucher = async (orderId, userId, voucherCode) => {
    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
        throw new ApiError(404, 'Order not found');
    }
    if (order.voucherId) {
        throw new ApiError(400, 'A voucher has already been applied to this order');
    }
    const currentAmount = order.subtotal + order.extraFee;
    const voucher = await voucherService.validateVoucher(voucherCode, userId, currentAmount);
    let discountTotal = 0;
    if (voucher.discountType === DISCOUNT_TYPE.PERCENTAGE) {
        discountTotal = (currentAmount * voucher.discountValue) / 100;
        if (voucher.maxDiscount && discountTotal > voucher.maxDiscount) {
            discountTotal = voucher.maxDiscount;
        }
    }
    else {
        discountTotal = voucher.discountValue;
    }
    if (discountTotal > currentAmount) {
        discountTotal = currentAmount;
    }
    order.discountTotal = discountTotal;
    order.totalAmount = currentAmount + order.deliveryFee - discountTotal;
    order.voucherId = voucher._id;
    await order.save();
    return order;
};
export const generateReceiptPdf = async (id) => {
    const order = await Order.findById(id)
        .populate('userId', 'name email address')
        .populate('serviceId', 'name price');
    if (!order) {
        throw new ApiError(404, 'Order not found');
    }
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err) => reject(err));
        doc
            .fillColor('#444444')
            .fontSize(25)
            .text('EcoShine', 50, 50, { align: 'center' })
            .fontSize(10)
            .text('Premium Laundry Solutions', { align: 'center' })
            .moveDown();
        doc.moveDown();
        doc
            .fillColor('#000000')
            .fontSize(18)
            .text('Receipt / Invoice', 50, 130);
        const invoiceTableTop = 160;
        doc
            .fontSize(10)
            .text('Order No:', 50, invoiceTableTop)
            .font('Helvetica-Bold')
            .text(order.orderNo, 150, invoiceTableTop)
            .font('Helvetica')
            .text('Date:', 50, invoiceTableTop + 15)
            .text(new Date(order.createdAt).toLocaleDateString(), 150, invoiceTableTop + 15)
            .text('Status:', 50, invoiceTableTop + 30)
            .text(order.status, 150, invoiceTableTop + 30);
        const customerInfoTop = 160;
        doc
            .fontSize(10)
            .text('Bill To:', 350, customerInfoTop)
            .font('Helvetica-Bold')
            .text(order.userId?.name || 'Valued Customer', 350, customerInfoTop + 15)
            .font('Helvetica')
            .text(order.userId?.email || '', 350, customerInfoTop + 30)
            .text(order.pickupAddress || '', 350, customerInfoTop + 45);
        const itemTableTop = 250;
        doc
            .font('Helvetica-Bold')
            .fontSize(10)
            .text('Service Description', 50, itemTableTop)
            .text('Weight/Qty', 280, itemTableTop, { width: 90, align: 'right' })
            .text('Unit Price', 370, itemTableTop, { width: 90, align: 'right' })
            .text('Total', 480, itemTableTop, { width: 50, align: 'right' });
        doc
            .moveTo(50, itemTableTop + 15)
            .lineTo(550, itemTableTop + 15)
            .stroke();
        let position = itemTableTop + 30;
        doc
            .font('Helvetica')
            .text(order.serviceId?.name || 'Laundry Service', 50, position)
            .text(`${order.weightKg || 1} kg`, 280, position, { width: 90, align: 'right' })
            .text(`₱${(order.subtotal / (order.weightKg || 1)).toFixed(2)}`, 370, position, { width: 90, align: 'right' })
            .text(`₱${order.subtotal.toFixed(2)}`, 480, position, { width: 50, align: 'right' });
        if (order.options && order.options.length > 0) {
            order.options.forEach((opt) => {
                position += 20;
                doc
                    .fontSize(9)
                    .text(`+ ${opt.name} (${opt.categoryName})`, 70, position)
                    .text(`₱${opt.price.toFixed(2)}`, 480, position, { width: 50, align: 'right' });
            });
        }
        position += 30;
        doc
            .moveTo(50, position)
            .lineTo(550, position)
            .stroke();
        position += 20;
        doc
            .fontSize(10)
            .text('Subtotal:', 350, position)
            .text(`₱${order.subtotal.toFixed(2)}`, 480, position, { width: 50, align: 'right' });
        position += 15;
        doc
            .text('Extra Fees:', 350, position)
            .text(`₱${order.extraFee.toFixed(2)}`, 480, position, { width: 50, align: 'right' });
        position += 15;
        doc
            .text('Delivery Fee:', 350, position)
            .text(`₱${order.deliveryFee.toFixed(2)}`, 480, position, { width: 50, align: 'right' });
        if ((order.discountTotal || 0) > 0) {
            position += 15;
            doc
                .fillColor('#EE5555')
                .text('Discount:', 350, position)
                .text(`- ₱${order.discountTotal.toFixed(2)}`, 480, position, { width: 50, align: 'right' })
                .fillColor('#000000');
        }
        position += 20;
        doc
            .font('Helvetica-Bold')
            .fontSize(14)
            .text('TOTAL:', 350, position)
            .text(`₱${order.totalAmount.toFixed(2)}`, 450, position, { width: 100, align: 'right' });
        doc
            .font('Helvetica')
            .fontSize(10)
            .text('Thank you for choosing EcoShine!', 50, 700, { align: 'center', width: 500 });
        doc.end();
    });
};
export const updateAnyOrder = async (id, updateData, userId, role) => {
    if (role === ROLES.ADMIN) {
        const existingOrder = await Order.findById(id).select('shopOwnerId');
        if (!existingOrder || existingOrder.shopOwnerId?.toString() !== userId) {
            throw new ApiError(404, 'Order not found');
        }
    }
    const order = await Order.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true }).populate('userId', 'name email telephone')
        .populate('serviceId', 'name price');
    if (!order) {
        throw new ApiError(404, 'Order not found');
    }
    return order;
};
export const softDeleteOrder = async (id, userId, role) => {
    if (role === ROLES.ADMIN) {
        const existingOrder = await Order.findById(id).select('shopOwnerId');
        if (!existingOrder || existingOrder.shopOwnerId?.toString() !== userId) {
            throw new ApiError(404, 'Order not found');
        }
    }
    const order = await Order.findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true });
    if (!order) {
        throw new ApiError(404, 'Order not found');
    }
    return order;
};
