process.env.JWT_SECRET = "test-jwt-secret-key";
process.env.NODE_ENV = "test";
import { jest } from "@jest/globals";
import request from "supertest";
import app from "../../app.js";
import { connectTestDB, disconnectTestDB, clearTestDB, createTestUser, getAuthHeader } from "../testHelpers.js";
jest.mock("../../core/expo.js", () => ({
    sendPushNotification: jest.fn(() => Promise.resolve()),
    default: jest.fn(() => Promise.resolve({
        chunkPushNotifications: jest.fn(() => []),
        sendPushNotificationsAsync: jest.fn(() => Promise.resolve([])),
    }))
}));
describe("User Integration Tests", () => {
    beforeAll(async () => { await connectTestDB(); });
    afterAll(async () => { await disconnectTestDB(); });
    afterEach(async () => { await clearTestDB(); });
    describe("GET /api/users/profile", () => {
        it("should return user profile when authenticated", async () => {
            const { user, token } = await createTestUser("CUSTOMER");
            const res = await request(app)
                .get("/api/users/profile")
                .set(getAuthHeader(token));
            expect(res.status).toBe(200);
            expect(res.body.data.email).toBe(user.email);
        });
        it("should return 401 when not authenticated", async () => {
            const res = await request(app).get("/api/users/profile");
            expect(res.status).toBe(401);
        });
    });
    describe("PUT /api/users/profile", () => {
        it("should update user profile", async () => {
            const { token } = await createTestUser("CUSTOMER");
            const res = await request(app)
                .put("/api/users/profile")
                .set(getAuthHeader(token))
                .send({ name: "Updated Name" });
            expect(res.status).toBe(200);
            expect(res.body.data.name).toBe("Updated Name");
        });
    });
    describe("GET /api/users (Admin Only)", () => {
        it("should list users for admin", async () => {
            const { token: adminToken } = await createTestUser("ADMIN");
            await createTestUser("CUSTOMER");
            const res = await request(app)
                .get("/api/users")
                .set(getAuthHeader(adminToken));
            expect(res.status).toBe(200);
            expect(res.body.data.length).toBeGreaterThanOrEqual(2);
        });
        it("should allow customers to view available shop owners", async () => {
            const { token: adminToken } = await createTestUser("ADMIN");
            const { token: customerToken } = await createTestUser("CUSTOMER");
            await request(app)
                .post("/api/auth/register-owner")
                .send({
                name: "Laundry Shop One",
                email: "shop1@example.com",
                telephone: "0771234567",
                address: "Main Street",
                password: "Test@1234",
            });
            await request(app)
                .post("/api/auth/register-owner")
                .send({
                name: "Laundry Shop Two",
                email: "shop2@example.com",
                telephone: "0777654321",
                address: "Market Road",
                password: "Test@1234",
            });
            const res = await request(app)
                .get("/api/users?role=ADMIN")
                .set(getAuthHeader(customerToken));
            expect(res.status).toBe(200);
            expect(res.body.data.length).toBeGreaterThanOrEqual(2);
            expect(res.body.data.some((shop) => shop.address === "Main Street")).toBe(true);
            expect(res.body.data.some((shop) => shop.address === "Market Road")).toBe(true);
        });
    });
    describe("DELETE /api/users/:id (Admin Only)", () => {
        it("should soft delete a user", async () => {
            const { token: adminToken } = await createTestUser("ADMIN");
            const { user: targetUser } = await createTestUser("CUSTOMER");
            const res = await request(app)
                .delete(`/api/users/${targetUser._id}`)
                .set(getAuthHeader(adminToken));
            expect(res.status).toBe(200);
            expect(res.body.data.isActive).toBe(false);
        });
    });
});
