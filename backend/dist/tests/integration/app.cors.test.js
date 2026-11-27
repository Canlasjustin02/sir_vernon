process.env.JWT_SECRET = "test-jwt-secret-key";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-key";
process.env.NODE_ENV = "test";
import request from "supertest";
import app from "../../app.js";
describe("CORS configuration", () => {
    it.each([
        "http://localhost:5173",
        "https://sirvernon-s4zj-rdng2vy5t-canlasjustin02s-projects.vercel.app",
        "https://sir-vernon-preview.vercel.app",
    ])("allows requests from %s with credentials", async (origin) => {
        const response = await request(app)
            .options("/api/auth/login")
            .set("Origin", origin)
            .set("Access-Control-Request-Method", "POST");
        expect(response.headers["access-control-allow-origin"]).toBe(origin);
        expect(response.headers["access-control-allow-credentials"]).toBe("true");
    });
    it("does not allow unrelated origins", async () => {
        const response = await request(app)
            .options("/api/auth/login")
            .set("Origin", "https://unrelated.example")
            .set("Access-Control-Request-Method", "POST");
        expect(response.headers["access-control-allow-origin"]).toBeUndefined();
    });
});
