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
      walk(fullPath, results);
    } else {
      if (file.toLowerCase().endsWith(".csv")) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

const csvFiles = walk(targetDir);
console.log(`Found CSV files:`, csvFiles);

for (const csv of csvFiles) {
  console.log(`\nAnalyzing CSV: ${path.relative(targetDir, csv)}`);
  const content = fs.readFileSync(csv, "utf8");
  const lines = content.split("\n");
  console.log(`Total lines: ${lines.length}`);
  
  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    if (line.includes("大小坪數") || line.includes("鄉野") || line.includes("獨立洗") || line.includes("洗機")) {
      console.log(`- MATCH at line ${idx + 1}: ${line.slice(0, 150)}`);
    }
  }
}
