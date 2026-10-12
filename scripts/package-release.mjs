import { readdirSync, readFileSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Vercel's filePathMap refers to traced files in the build workspace.
// Package those exact files, including the generated Prisma client, so CD
// deploys the tested dependencies rather than installing a new copy.
const files = new Set([".vercel/output", ".vercel/project.json", "package.json", "package-lock.json"]);
function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (entry.name === ".vc-config.json") {
      const config = JSON.parse(readFileSync(path, "utf8"));
      for (const source of Object.keys(config.filePathMap ?? {})) {
        if (!existsSync(source)) throw new Error(`Missing traced file: ${source}`);
        if (source === ".env" || source.startsWith(".env." ) && source !== ".env.example") {
          throw new Error(`Environment file must not be packaged: ${source}`);
        }
        files.add(source);
      }
    }
  }
}
walk(".vercel/output/functions");
writeFileSync("release-files.txt", [...files].join("\0") + "\0");
console.log(`Packaging ${files.size} traced paths`);
