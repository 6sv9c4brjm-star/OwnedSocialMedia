import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// IMPORTANT for GitHub Pages: if you deploy to a PROJECT page
// (https://<user>.github.io/<repo>/), set base to "/<repo>/".
// If you deploy to a USER/ORG page (https://<user>.github.io/), leave it as "/".
export default defineConfig({
  plugins: [react()],
  base: "/theory-atlas/",
});
