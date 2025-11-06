import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { globby } from "globby";
import strip from "strip-comments";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function stripCssComments(css) {
  // Remove /* ... */ comments in CSS safely (non-greedy, across lines)
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

async function processFile(filePath) {
  const original = await fs.readFile(filePath, "utf8");
  const ext = path.extname(filePath).toLowerCase();

  let result;
  if (ext === ".js") {
    result = strip(original);
  } else if (ext === ".css") {
    result = stripCssComments(original);
  } else {
    return; // skip other types
  }

  if (result === original) return; // nothing to change

  // Backup
  await fs.writeFile(filePath + ".bak", original, "utf8");
  // Write stripped content
  await fs.writeFile(filePath, result, "utf8");
}

async function main() {
  const root = path.resolve(__dirname, "..");
  const patterns = [
    "src/**/*.js",
    "src/**/*.css",
  ];

  const files = await globby(patterns, { gitignore: true, cwd: root, absolute: true });
  for (const file of files) {
    await processFile(file);
  }
  console.log(`Processed ${files.length} files.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


