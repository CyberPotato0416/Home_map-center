const fs = require('fs');
const https = require('https');
const { execSync } = require('child_process');
const path = require('path');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      const file = fs.createWriteStream(dest);
      let downloaded = 0;
      let lastReport = 0;
      res.on('data', chunk => {
        downloaded += chunk.length;
        if (downloaded - lastReport > 2 * 1024 * 1024) { 
           console.log(`Downloaded ${Math.round(downloaded / 1024 / 1024)}MB...`);
           lastReport = downloaded;
        }
      });
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
      file.on('error', reject);
    }).on('error', reject);
  });
}

(async () => {
  try {
    console.log("Downloading repo...");
    await download('https://github.com/CyberPotato0416/Home_map-center/archive/refs/heads/main.zip', 'repo.zip');
    
    console.log("Extracting...");
    const outDir = path.join(process.cwd(), 'temp_repo');
    if (fs.existsSync(outDir)) { fs.rmSync(outDir, {recursive: true, force: true}); }
    fs.mkdirSync(outDir, {recursive: true});

    execSync(`npx -y extract-zip repo.zip "${outDir}"`, {stdio: 'inherit'});
    
    console.log("Copying CSV...");
    const srcCsv = path.join(outDir, 'Home_map-center-main', 'public', 'rentals_import.csv');
    const destCsv = path.join(process.cwd(), 'public', 'rentals_import.csv');
    if (fs.existsSync(srcCsv)) {
        fs.copyFileSync(srcCsv, destCsv);
    }
    
    console.log("Copying Images...");
    const srcImgDir = path.join(outDir, 'Home_map-center-main', 'public', 'rentals_images');
    const destImgDir = path.join(process.cwd(), 'public', 'rentals_images');
    if (fs.existsSync(srcImgDir)) {
        fs.cpSync(srcImgDir, destImgDir, {recursive: true});
    }
    
    console.log("Sync complete!");
  } catch (error) {
    console.error("Sync Failed:", error);
  }
})();
