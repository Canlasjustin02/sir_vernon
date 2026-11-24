process.env.JWT_SECRET = "test-jwt-secret-key";
process.env.NODE_ENV = "test";
jest.setTimeout(30000);
import request from "supertest";
import { jest } from "@jest/globals";
import app from "../../app.js";
import mongoose from "mongoose";
import { connectTestDB, disconnectTestDB, clearTestDB, createTestUser, getAuthHeader } from "../testHelpers.js";
import Service from "../../database/models/Service.js";
import { runInTenantContext } from "../../database/tenantContext.js";
describe("Service Integration Tests", () => {
    let categoryId;
    beforeAll(async () => { await connectTestDB(); });
    afterAll(async () => { await disconnectTestDB(); });
    beforeEach(async () => {
        await clearTestDB();
        categoryId = new mongoose.Types.ObjectId().toString();
    });
    describe("GET /api/services", () => {
        it("should list all services (public access)", async () => {
            const { user: shopOwner } = await createTestUser("ADMIN");
            await runInTenantContext(shopOwner._id.toString(), () => Service.create({ name: "Wash", price: 10, categoryId }));
            const res = await request(app)
                .get("/api/services")
                .set("x-shop-id", shopOwner._id.toString());
            expect(res.status).toBe(200);
            expect(res.body.data.items.length).toBe(1);
        });
        it("should require a shop for public service discovery", async () => {
            const res = await request(app).get("/api/services");
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Select a shop to continue");
        });
    });
    describe("POST /api/services (Admin/Staff Only)", () => {
        it("should create a new service", async () => {
            const { user: adminUser, token: adminToken } = await createTestUser("ADMIN");
            const res = await request(app)
                .post("/api/services")
                .set(getAuthHeader(adminToken))
                .set("x-shop-id", adminUser._id.toString())
                .send({
                name: "Dry Clean",
                price: 100,
                categoryId
            });
            expect(res.status).toBe(201);
            expect(res.body.data.name).toBe("Dry Clean");
        });
        it("should keep each owner's services in their own catalog", async () => {
            const { user: firstOwner, token: firstOwnerToken } = await createTestUser("ADMIN");
            const { user: secondOwner, token: secondOwnerToken } = await createTestUser("ADMIN");
            const firstCreate = await request(app)
                .post("/api/services")
                .set(getAuthHeader(firstOwnerToken))
                .set("x-shop-id", firstOwner._id.toString())
                .send({ name: "Shop One Wash", price: 12, categoryId });
            const secondCreate = await request(app)
                .post("/api/services")
                .set(getAuthHeader(secondOwnerToken))
                .set("x-shop-id", secondOwner._id.toString())
                .send({ name: "Shop Two Wash", price: 15, categoryId });
            expect(firstCreate.status).toBe(201);
            expect(secondCreate.status).toBe(201);
            const firstCatalog = await request(app)
                .get("/api/services/manage")
                .set(getAuthHeader(firstOwnerToken))
                .set("x-shop-id", firstOwner._id.toString());
            expect(firstCatalog.status).toBe(200);
            expect(firstCatalog.body.data.items).toHaveLength(1);
            expect(firstCatalog.body.data.items[0].name).toBe("Shop One Wash");
            expect(firstCatalog.body.data.items[0].ownerId.toString()).toBe(firstOwner._id.toString());
            const crossShopRequest = await request(app)
                .get("/api/services/manage")
                .set(getAuthHeader(secondOwnerToken))
                .set("x-shop-id", firstOwner._id.toString());
            expect(crossShopRequest.status).toBe(403);
        });
    });
});
