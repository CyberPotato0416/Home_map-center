import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { execSync } from "child_process";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Configure high limits for files and JSON payloads
  app.use(express.json({ limit: "500mb" }));
  app.use(express.urlencoded({ limit: "500mb", extended: true }));

  // Raw file upload endpoint for uploading individual files (like from folder drop)
  app.post("/api/upload-file", express.raw({ type: "*/*", limit: "150mb" }), (req, res) => {
    try {
      const relPath = req.headers["x-file-path"] as string;
      if (!relPath) {
        return res.status(400).json({ error: "Missing x-file-path header" });
      }

      // Prevent directory traversal attacks
      const resolvedPath = path.resolve(process.cwd(), "public", relPath);
      const publicBase = path.resolve(process.cwd(), "public");
      
      if (!resolvedPath.startsWith(publicBase)) {
        return res.status(403).json({ error: "Access Denied: Path traversal detected." });
      }

      // Ensure target directory exists
      fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });

      // Save file contents
      fs.writeFileSync(resolvedPath, req.body);
      
      console.log(`Saved uploaded file to: ${resolvedPath}`);
      res.json({ success: true, path: relPath });
    } catch (err: any) {
      console.error("Upload file error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // ZIP upload and extract endpoint
  app.post("/api/upload-zip", express.raw({ type: "application/zip", limit: "400mb" }), (req, res) => {
    try {
      const zipPath = path.join(process.cwd(), "temp_uploaded_images.zip");
      fs.writeFileSync(zipPath, req.body);

      console.log("ZIP file written. Extracting...");
      const targetDir = path.join(process.cwd(), "public", "rentals_images");
      fs.mkdirSync(targetDir, { recursive: true });

      // Unzip
      let extracted = false;
      try {
        console.log("unzipping via native command...");
        execSync(`unzip -o "${zipPath}" -d "${targetDir}"`, { stdio: "inherit" });
        extracted = true;
      } catch (unzipErr) {
        console.log("Native unzip failed or not present, trying extract-zip package...");
      }

      if (!extracted) {
        try {
          execSync(`npx -y extract-zip "${zipPath}" "${targetDir}"`, { stdio: "inherit" });
          extracted = true;
        } catch (npxErr) {
          console.log("npx extract-zip failed");
        }
      }

      // Remove temp zip file
      if (fs.existsSync(zipPath)) {
        fs.unlinkSync(zipPath);
      }

      console.log("Extraction stage complete.");

      // Run folders post-process (lift IDs and flatten subfolders)
      flattenRentalImagesDir(targetDir);

      res.json({ success: true });
    } catch (err: any) {
      console.error("ZIP Upload error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // RAR upload and extract fallback endpoint
  app.post("/api/upload-rar", express.raw({ type: "*/*", limit: "400mb" }), (req, res) => {
    try {
      const rarPath = path.join(process.cwd(), "temp_uploaded_images.rar");
      fs.writeFileSync(rarPath, req.body);
      console.log("RAR file written. Appraising extraction tools...");
      const targetDir = path.join(process.cwd(), "public", "rentals_images");
      fs.mkdirSync(targetDir, { recursive: true });

      let extracted = false;
      // Try unrar
      try {
        execSync(`unrar x -o+ "${rarPath}" "${targetDir}"`, { stdio: "inherit" });
        extracted = true;
      } catch (e) {
        console.log("unrar CLI failed or unavailable.");
      }

      // Try unar
      if (!extracted) {
        try {
          execSync(`unar -f -o "${targetDir}" "${rarPath}"`, { stdio: "inherit" });
          extracted = true;
        } catch (e) {
          console.log("unar CLI failed or unavailable.");
        }
      }

      // Try 7z
      if (!extracted) {
        try {
          execSync(`7z x -y -o"${targetDir}" "${rarPath}"`, { stdio: "inherit" });
          extracted = true;
        } catch (e) {
          console.log("7z CLI failed or unavailable.");
        }
      }

      if (fs.existsSync(rarPath)) {
        fs.unlinkSync(rarPath);
      }

      if (extracted) {
        flattenRentalImagesDir(targetDir);
        res.json({ success: true });
      } else {
        // Fallback info
        res.status(400).json({ 
          error: "伺服器環境中未偵測到相容的 RAR 解壓工具。請將檔案壓縮為 .zip 格式上傳，或直接在此拖放解壓後的 rentals_images 資料夾！" 
        });
      }
    } catch (err: any) {
      console.error("RAR Upload error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Get current status of public/rentals_images categories and image counts
  app.get("/api/rentals-images-status", (req, res) => {
    try {
      const targetDir = path.join(process.cwd(), "public", "rentals_images");
      if (!fs.existsSync(targetDir)) {
        return res.json({ folders: [] });
      }
      const list = fs.readdirSync(targetDir);
      const foldersList = [];
      const idRegex = /^(\d{6,10}|[a-z]+_\d+|[a-z0-9]{15,17})$/i;

      for (const item of list) {
        const full = path.join(targetDir, item);
        if (fs.statSync(full).isDirectory()) {
          const files = fs.readdirSync(full).filter(f => !f.startsWith('.'));
          const isMatchedId = idRegex.test(item) || item.startsWith("gov_") || item.startsWith("renco_");
          foldersList.push({ 
            name: item, 
            count: files.length,
            isIdFolder: isMatchedId
          });
        }
      }
      res.json({ folders: foldersList });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Serve with Vite and API fallbacks
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Helper to collapse unnecessary nested folders if users upload wrapped ZIP structures
function flattenRentalImagesDir(baseDir: string) {
  try {
    // 1. If zip was packaged with 'rentals_images' folder, e.g. public/rentals_images/rentals_images
    const nestedDir = path.join(baseDir, "rentals_images");
    if (fs.existsSync(nestedDir) && fs.statSync(nestedDir).isDirectory()) {
      console.log("Flattening nested rentals_images folder...");
      const subItems = fs.readdirSync(nestedDir);
      for (const item of subItems) {
        const src = path.join(nestedDir, item);
        const dest = path.join(baseDir, item);
        if (fs.existsSync(dest)) {
          // Merge images inside
          if (fs.statSync(src).isDirectory()) {
            const files = fs.readdirSync(src);
            for (const file of files) {
              const fileSrc = path.join(src, file);
              const fileDest = path.join(dest, file);
              fs.mkdirSync(dest, { recursive: true });
              fs.copyFileSync(fileSrc, fileDest);
            }
          } else {
            fs.copyFileSync(src, dest);
          }
        } else {
          fs.renameSync(src, dest);
        }
      }
      fs.rmSync(nestedDir, { recursive: true, force: true });
    }

    // 2. Scan recursively and lift any folder that looks like a rental ID (6-10 digits, gov_*, or custom keys)
    const items = fs.readdirSync(baseDir);
    const idRegex = /^(\d{6,10}|[a-z]+_\d+|[a-z0-9]{15,17})$/i;
    
    function findAndLiftIds(dir: string) {
      const children = fs.readdirSync(dir);
      for (const ch of children) {
        const fullCh = path.join(dir, ch);
        if (fs.statSync(fullCh).isDirectory()) {
          const isId = idRegex.test(ch) || ch.startsWith("gov_") || ch.startsWith("renco_");
          if (isId) {
            const destRootCh = path.join(baseDir, ch);
            if (fullCh !== destRootCh) {
              console.log(`Lifting ID folder ${ch} from ${fullCh} to ${destRootCh}`);
              if (!fs.existsSync(destRootCh)) {
                fs.mkdirSync(destRootCh, { recursive: true });
              }
              const imgs = fs.readdirSync(fullCh);
              for (const img of imgs) {
                fs.copyFileSync(path.join(fullCh, img), path.join(destRootCh, img));
              }
              fs.rmSync(fullCh, { recursive: true, force: true });
            }
          } else {
            findAndLiftIds(fullCh);
          }
        }
      }
    }
    
    for (const item of items) {
      const full = path.join(baseDir, item);
      const isSystemId = idRegex.test(item) || item.startsWith("gov_") || item.startsWith("renco_");
      if (fs.statSync(full).isDirectory() && !isSystemId) {
        findAndLiftIds(full);
        // Clean empty folders
        try {
          if (fs.readdirSync(full).length === 0) {
            fs.rmdirSync(full);
          }
        } catch (_) {}
      }
    }
  } catch (error) {
    console.error("Error flattening directory structure:", error);
  }
}

startServer();
