import fs from "fs";
import https from "https";
import path from "path";

const user = "CyberPotato0416";
const repo = "Home_map-center";
const branch = "main";
const dirs = ["gov_112", "gov_155", "gov_159", "gov_182", "gov_194", "gov_197", "gov_226", "gov_238", "gov_255"];

// Let's also fetch the rental_import.csv if maybe the user modified it there!
const fileToUpdate = [
  { url: "https://raw.githubusercontent.com/CyberPotato0416/Home_map-center/main/public/rentals_import.csv", path: "public/rentals_import.csv" }
];

async function downloadDir(dirName) {
  const apiUrl = "https://api.github.com/repos/" + user + "/" + repo + "/contents/public/rentals_images/" + dirName + "?ref=" + branch;
  
  const options = {
    headers: {
      "User-Agent": "NodeJS"
    }
  };

  const p = new Promise((resolve, reject) => {
    https.get(apiUrl, options, (res) => {
      let data = '';
      res.on("data", chunk => data += chunk);
      res.on("end", async () => {
        if (res.statusCode !== 200) {
          console.error("Failed to fetch metadata for " + dirName + ": " + res.statusCode);
          return resolve();
        }
        
        try {
          const files = JSON.parse(data);
          const targetDir = path.join(process.cwd(), "public", "rentals_images", dirName);
          fs.mkdirSync(targetDir, { recursive: true });
          
          for (const file of files) {
            if (file.type === 'file' && file.name.endsWith('.jpg')) {
              console.log("Downloading " + file.name + " to " + dirName + "...");
              await downloadFile(file.download_url, path.join(targetDir, file.name));
            }
          }
          resolve();
        } catch(e) {
          console.error("Parse error:", e);
          resolve();
        }
      });
    }).on("error", reject);
  });
  
  return p;
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      res.pipe(file);
      file.on("finish", () => {
        console.log("Finished saving " + dest);
        file.close(resolve);
      });
    }).on("error", (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function main() {
  for (const d of dirs) {
    await downloadDir(d);
  }
  for (const f of fileToUpdate) {
  	await downloadFile(f.url, path.join(process.cwd(), f.path));
  }
}

main().catch(console.error);
