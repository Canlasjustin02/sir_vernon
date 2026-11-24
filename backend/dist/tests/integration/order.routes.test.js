process.env.JWT_SECRET = "test-jwt-secret-key";
process.env.NODE_ENV = "test";
import request from "supertest";
import app from "../../app.js";
import mongoose from "mongoose";
import { connectTestDB, disconnectTestDB, clearTestDB, createTestUser, getAuthHeader } from "../testHelpers.js";
import Service from "../../database/models/Service.js";
import Inventory from "../../database/models/Inventory.js";
import Order from "../../database/models/Order.js";
describe("Order Integration Tests", () => {
    let serviceId;
    let inventoryId;
    beforeAll(async () => {
        await connectTestDB();
    });
    afterAll(async () => { await disconnectTestDB(); });
    beforeEach(async () => {
        await clearTestDB();
        const service = await Service.create({
            name: "Wash & Fold",
            price: 150,
            categoryId: new mongoose.Types.ObjectId().toString()
        });
        serviceId = service._id.toString();
        const inventory = await Inventory.create({
            name: "Detergent",
            categoryName: "Supplies",
            unit: "KG",
            unitPrice: 10,
            qtyInStock: 100,
            supplierId: new mongoose.Types.ObjectId().toString()
        });
        inventoryId = inventory._id.toString();
    });
    describe("POST /api/orders", () => {
        it("should create a new order", async () => {
            const { token } = await createTestUser("CUSTOMER");
            const res = await request(app)
                .post("/api/orders")
                .set(getAuthHeader(token))
                .send({
                serviceId,
                weightKg: 2,
                paymentMethod: "COD",
                pickupAddress: "123 Main St",
                deliveryAddress: "456 Side St"
            });
            expect(res.status).toBe(201);
            expect(res.body.data.orderNo).toBeDefined();
        });
        it("should show each shop owner only bookings for their shop", async () => {
            const { token: customerToken } = await createTestUser("CUSTOMER");
            const { user: firstOwner, token: firstOwnerToken } = await createTestUser("ADMIN");
            const { user: secondOwner, token: secondOwnerToken } = await createTestUser("ADMIN");
            const createdOrders = [];
            for (const shopOwnerId of [firstOwner._id, secondOwner._id]) {
                const createResponse = await request(app)
                    .post("/api/orders")
                    .set(getAuthHeader(customerToken))
                    .send({
                    serviceId,
                    shopOwnerId: shopOwnerId.toString(),
                    weightKg: 2,
                    paymentMethod: "COD",
                });
                expect(createResponse.status).toBe(201);
                createdOrders.push(createResponse.body.data);
            }
            const ownerOrdersResponse = await request(app)
                .get("/api/orders")
                .set(getAuthHeader(firstOwnerToken));
            expect(ownerOrdersResponse.status).toBe(200);
            expect(ownerOrdersResponse.body.data.orders).toHaveLength(1);
            expect(ownerOrdersResponse.body.data.orders[0].shopOwnerId._id).toBe(firstOwner._id.toString());
            expect(ownerOrdersResponse.body.data.orders[0].status).toBe("ORDER_PLACED");
            const availableOrdersResponse = await request(app)
                .get("/api/orders/available")
                .set(getAuthHeader(firstOwnerToken));
            expect(availableOrdersResponse.status).toBe(200);
            expect(availableOrdersResponse.body.data.orders).toHaveLength(1);
            expect(availableOrdersResponse.body.data.orders[0]._id).toBe(createdOrders[0]._id);
            const crossShopDetailsResponse = await request(app)
                .get(`/api/orders/${createdOrders[0]._id}`)
                .set(getAuthHeader(secondOwnerToken));
            expect(crossShopDetailsResponse.status).toBe(404);
            const crossShopClaimResponse = await request(app)
                .patch(`/api/orders/${createdOrders[0]._id}/claim`)
                .set(getAuthHeader(secondOwnerToken));
            expect(crossShopClaimResponse.status).toBe(404);
            const crossShopDeleteResponse = await request(app)
                .delete(`/api/orders/${createdOrders[0]._id}`)
                .set(getAuthHeader(secondOwnerToken));
            expect(crossShopDeleteResponse.status).toBe(404);
        });
        it("should return 400 for invalid data", async () => {
            const { token } = await createTestUser("CUSTOMER");
            const res = await request(app)
                .post("/api/orders")
                .set(getAuthHeader(token))
                .send({ serviceId: "invalid-id" });
            expect(res.status).toBe(400);
        });
    });
    describe("GET /api/orders/my", () => {
        it("should list current customer orders", async () => {
            const { user, token } = await createTestUser("CUSTOMER");
            await Order.create({
                orderNo: "ORD-001",
                userId: user._id,
                serviceId,
                totalAmount: 150,
                status: "ORDER_PLACED",
                paymentMethod: "NONE",
                paymentStatus: "PENDING"
            });
            const res = await request(app)
                .get("/api/orders/my")
                .set(getAuthHeader(token));
            expect(res.status).toBe(200);
            expect(res.body.data.orders.length).toBe(1);
        });
    });
    describe("PATCH /api/orders/:id/status (Admin/Staff)", () => {
        it("should update order status", async () => {
            const { user } = await createTestUser("CUSTOMER");
            const { user: adminUser, token: adminToken } = await createTestUser("ADMIN");
            const order = await Order.create({
                orderNo: "ORD-002",
                userId: user._id,
                shopOwnerId: adminUser._id,
                serviceId,
                totalAmount: 150,
                status: "ORDER_PLACED",
                paymentMethod: "NONE",
                paymentStatus: "PENDING"
            });
            const res = await request(app)
                .patch(`/api/orders/${order._id}/status`)
                .set(getAuthHeader(adminToken))
                .send({ status: "WASHING" });
            expect(res.status).toBe(200);
            expect(res.body.data.status).toBe("WASHING");
        });
    });
});
