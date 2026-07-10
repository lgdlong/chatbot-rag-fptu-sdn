import type { NextConfig } from "next";
import path from "node:path";
import fs from "node:fs";

// Programmatically load the root .env file at startup by walking up the directory tree
try {
  let dir = __dirname;
  let envPath = "";
  for (let i = 0; i < 5; i++) {
    const checkPath = path.resolve(dir, ".env");
    if (fs.existsSync(checkPath)) {
      envPath = checkPath;
      break;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  if (envPath) {
    process.loadEnvFile(envPath);
  }
} catch (e) {
  // Ignore env loading errors
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
