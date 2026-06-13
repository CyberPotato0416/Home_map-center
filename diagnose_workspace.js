import fs from "fs";
import path from "path";

const targetDir = process.cwd();

function walk(dir, results = []) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (file === "node_modules" || file === ".git" || file === ".next" || file === "dist") {
      continue;
    }
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results.push({ type: "dir", path: fullPath, name: file });
      walk(fullPath, results);
    } else {
      results.push({ type: "file", path: fullPath, name: file });
    }
  }
  return results;
}

console.log("Analyzing workspace files and directories...");
const items = walk(targetDir);

// Find all directories named like rental IDs, or containing image files
const idRegex = /^(\d{6,10}|gov_\d+|[a-z0-9]{16}|renco_\d+)$/i;
const imageRegex = /\.(jpg|jpeg|png|webp|gif)$/i;

const imageFolders = {};

for (const item of items) {
  if (item.type === "file" && imageRegex.test(item.name)) {
    const parent = path.dirname(item.path);
    if (!imageFolders[parent]) {
      imageFolders[parent] = [];
    }
    imageFolders[parent].push(item.name);
  }
}

console.log("\n--- FOLDERS CONTAINING IMAGES ---");
for (const [folder, files] of Object.entries(imageFolders)) {
  const relPath = path.relative(targetDir, folder);
  const folderName = path.basename(folder);
  const matchesId = idRegex.test(folderName);
  console.log(`Folder: ${relPath} (${matchesId ? "MATCHES ID" : "NOT AN ID"}) - Contains ${files.length} images`);
  if (files.length <= 15) {
    console.log(`  Files: ${files.slice(0, 5).join(", ")}` + (files.length > 5 ? `... (+${files.length - 5} more)` : ""));
  }
}

console.log("\n--- REGULAR FOLDERS THAT MATCH ID PATTERN ---");
const idFolders = items.filter(i => i.type === "dir" && idRegex.test(i.name));
for (const f of idFolders) {
  const rel = path.relative(targetDir, f.path);
  console.log(`ID Folder: ${rel}`);
}
