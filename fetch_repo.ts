import { execSync } from "child_process";
import fs from "fs";
import https from "https";
import path from "path";
import { extract } from "tar";

const repoUrl = "https://github.com/CyberPotato0416/Home_map-center/archive/refs/heads/main.tar.gz";
const tarPath = "/tmp/repo.tar.gz";
const extractPath = "/tmp/extracted_repo";

async function downloadAndExtract() {
  console.log("Downloading...");
  const file = fs.createWriteStream(tarPath);
  
  await new Promise((resolve, reject) => {
    https.get(repoUrl, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        https.get(response.headers.location!, (res) => {
          res.pipe(file);
          file.on("finish", () => {
            file.close(resolve);
          });
        }).on("error", reject);
      } else {
        response.pipe(file);
        file.on("finish", () => {
          file.close(resolve);
        });
      }
    }).on("error", reject);
  });

  console.log("Extracting...");
  fs.mkdirSync(extractPath, { recursive: true });
  await extract({
    file: tarPath,
    cwd: extractPath,
  });
  
  console.log("Copying images...");
  const sourceImages = path.join(extractPath, "Home_map-center-main", "public", "rentals_images");
  const targetImages = path.join(process.cwd(), "public", "rentals_images");
  
  execSync(`cp -R ${sourceImages}/* ${targetImages}/`, { stdio: "inherit" });
  console.log("Done!");
}

downloadAndExtract().catch(console.error);
