import fs from "fs";
import path from "path";

const rootPublicImagesDir = path.join(process.cwd(), "public", "rentals_images");
const srcDir = path.join(process.cwd(), "src");

// 1. Get all folders in public/rentals_images
let publicFolders = [];
if (fs.existsSync(rootPublicImagesDir)) {
  publicFolders = fs.readdirSync(rootPublicImagesDir).filter(f => {
    return fs.statSync(path.join(rootPublicImagesDir, f)).isDirectory();
  });
}
console.log(`Folders in root public/rentals_images (${publicFolders.length}):`, publicFolders.join(", "));

// 2. Walk src directory and collect any subfolder under "rentals_images"
const nestedFolders = {};

function walk(dir) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (file === "node_modules" || file === ".git" || file === ".next" || file === "dist") {
      continue;
    }
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file === "rentals_images") {
        // Collect children directories
        const children = fs.readdirSync(fullPath);
        for (const child of children) {
          const childPath = path.join(fullPath, child);
          if (fs.statSync(childPath).isDirectory()) {
            if (!nestedFolders[child]) {
              nestedFolders[child] = [];
            }
            nestedFolders[child].push(childPath);
          }
        }
      }
      walk(fullPath);
    }
  }
}

walk(srcDir);

console.log(`\nFound nested ID folders in src/ directory:`, Object.keys(nestedFolders).length);

// 3. Find folders in nested src but missing in public/rentals_images
const missingInPublic = [];
for (const [id, paths] of Object.entries(nestedFolders)) {
  if (!publicFolders.includes(id)) {
    missingInPublic.push({ id, paths });
  }
}

console.log(`\n--- FOLDERS MISSING IN PUBLIC/RENTALS_IMAGES ---`);
if (missingInPublic.length === 0) {
  console.log("None! All nested ID folders also exist in the public directory.");
} else {
  missingInPublic.forEach(item => {
    console.log(`ID: ${item.id} - found in:`);
    item.paths.forEach(p => console.log(`  - ${path.relative(process.cwd(), p)}`));
  });
}

// 4. Let's inspect each nested folder structure to see if there is any text, txt, JSON, or image containing metadata
console.log("\nSearching for any metadata, text or non-image files inside the rentals_images directories...");
function searchMetadata(dir) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      searchMetadata(full);
    } else {
      const ext = path.extname(file).toLowerCase();
      if (ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png" && ext !== ".webp" && ext !== ".gif" && file !== ".DS_Store" && file !== "LICENSE") {
        console.log(`Found file: ${path.relative(process.cwd(), full)}`);
        try {
          const content = fs.readFileSync(full, "utf8");
          if (content.length < 500) {
            console.log(`  Content: ${content}`);
          } else {
            console.log(`  Content length: ${content.length}`);
          }
        } catch (e) {
          console.log(`  Could not read content: ${e.message}`);
        }
      }
    }
  }
}
if (fs.existsSync(rootPublicImagesDir)) searchMetadata(rootPublicImagesDir);
searchMetadata(srcDir);
