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
        if (downloaded - lastReport > 5 * 1024 * 1024) { 
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

// Helper to recursively copy directories
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      // Skip node_modules and temp files
      if (childItemName === 'node_modules' || childItemName === '.git') return;
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

(async () => {
  try {
    console.log("📥 Downloading repository zip from GitHub...");
    await download('https://github.com/CyberPotato0416/Home_map-center/archive/refs/heads/main.zip', 'repo.zip');
    
    console.log("📦 Extracting archive...");
    const outDir = path.join(process.cwd(), 'temp_repo');
    if (fs.existsSync(outDir)) { 
      fs.rmSync(outDir, {recursive: true, force: true}); 
    }
    fs.mkdirSync(outDir, {recursive: true});

    execSync(`npx -y extract-zip repo.zip "${outDir}"`, {stdio: 'inherit'});
    
    console.log("🔄 Synchronizing all workspace files (simulating git pull)...");
    const extractedRepoDir = path.join(outDir, 'Home_map-center-main');
    if (fs.existsSync(extractedRepoDir)) {
      copyRecursiveSync(extractedRepoDir, process.cwd());
    }
    
    // Clean up temporary files
    console.log("🧹 Cleaning up temp files...");
    fs.rmSync(outDir, {recursive: true, force: true});
    fs.unlinkSync('repo.zip');
    
    console.log("✅ Sync complete! Workspace is now fully synchronized with GitHub main branch.");
  } catch (error) {
    console.error("❌ Sync Failed:", error);
  }
})();
