process.env.JWT_SECRET = "test-jwt-secret-key";
process.env.NODE_ENV = "test";
jest.setTimeout(30000);
import mongoose from "mongoose";
import { jest } from "@jest/globals";
import Service from "../../database/models/Service.js";
import { runInTenantContext } from "../../database/tenantContext.js";
import { connectTestDB, disconnectTestDB } from "../testHelpers.js";
describe("shop database isolation", () => {
    const firstShopId = new mongoose.Types.ObjectId().toString();
    const secondShopId = new mongoose.Types.ObjectId().toString();
    beforeAll(async () => {
        await connectTestDB();
    });
    afterAll(async () => {
        await disconnectTestDB();
    });
    it("keeps operational records in the selected shop database", async () => {
        const categoryId = new mongoose.Types.ObjectId();
        await runInTenantContext(firstShopId, () => Service.create({ name: "First shop wash", price: 10, categoryId }));
        await runInTenantContext(secondShopId, () => Service.create({ name: "Second shop wash", price: 15, categoryId }));
        const firstShopServices = await runInTenantContext(firstShopId, () => Service.find().lean());
        const secondShopServices = await runInTenantContext(secondShopId, () => Service.find().lean());
        expect(firstShopServices.map((service) => service.name)).toEqual([
            "First shop wash",
        ]);
        expect(secondShopServices.map((service) => service.name)).toEqual([
            "Second shop wash",
        ]);
    });
});
