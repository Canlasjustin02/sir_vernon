import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ command, mode }) => {
  if (command === "build" && process.env.VERCEL) {
    const apiBaseUrl = loadEnv(mode, process.cwd(), "VITE_").VITE_API_BASE_URL;
    if (!apiBaseUrl) {
      throw new Error(
        "Set VITE_API_BASE_URL in Vercel to your deployed backend URL, including /api."
      );
    }

    let apiUrl: URL;

    try {
      apiUrl = new URL(apiBaseUrl);
    } catch {
      throw new Error("VITE_API_BASE_URL in Vercel must be a valid HTTPS backend URL.");
    }

    if (
      apiUrl.protocol !== "https:" ||
      ["localhost", "127.0.0.1", "::1"].includes(apiUrl.hostname) ||
      apiUrl.pathname.replace(/\/+$/, "") !== "/api"
    ) {
      throw new Error(
        "VITE_API_BASE_URL in Vercel must be an HTTPS backend URL ending in /api, not localhost."
      );
    }
  }

  return {
    plugins: [react(), tailwindcss()],
  };
});
