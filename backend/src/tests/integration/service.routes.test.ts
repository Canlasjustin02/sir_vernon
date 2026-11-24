process.env.JWT_SECRET = "test-jwt-secret-key";
process.env.NODE_ENV = "test";

import request from "supertest";
import app from "../../app.js";
import mongoose from "mongoose";
import { connectTestDB, disconnectTestDB, clearTestDB, createTestUser, getAuthHeader } from "../testHelpers.js";
import Service from "../../database/models/Service.js";

describe("Service Integration Tests", () => {
  let categoryId: string;

  beforeAll(async () => { await connectTestDB(); });
  afterAll(async () => { await disconnectTestDB(); });
  
  beforeEach(async () => {
    await clearTestDB();
    categoryId = new mongoose.Types.ObjectId().toString();
  });

  describe("GET /api/services", () => {
    it("should list all services (public access)", async () => {
      await Service.create({ name: "Wash", price: 10, categoryId });
      const res = await request(app).get("/api/services");

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
    });
  });

  describe("POST /api/services (Admin/Staff Only)", () => {
    it("should create a new service", async () => {
      const { token: adminToken } = await createTestUser("ADMIN");
      const res = await request(app)
        .post("/api/services")
        .set(getAuthHeader(adminToken))
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
      const { token: secondOwnerToken } = await createTestUser("ADMIN");

      const firstCreate = await request(app)
        .post("/api/services")
        .set(getAuthHeader(firstOwnerToken))
        .send({ name: "Shop One Wash", price: 12, categoryId });
      const secondCreate = await request(app)
        .post("/api/services")
        .set(getAuthHeader(secondOwnerToken))
        .send({ name: "Shop Two Wash", price: 15, categoryId });

      expect(firstCreate.status).toBe(201);
      expect(secondCreate.status).toBe(201);

      const firstCatalog = await request(app)
        .get("/api/services/manage")
        .set(getAuthHeader(firstOwnerToken));

      expect(firstCatalog.status).toBe(200);
      expect(firstCatalog.body.data.items).toHaveLength(1);
      expect(firstCatalog.body.data.items[0].name).toBe("Shop One Wash");
      expect(firstCatalog.body.data.items[0].ownerId.toString()).toBe(firstOwner._id.toString());
    });
  });
});
