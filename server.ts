import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { execSync } from "child_process";

async function getImageContentType(filePath: string): Promise<string> {
  let fd;
  try {
    fd = await fs.promises.open(filePath, "r");
    const buffer = Buffer.alloc(12);
    const { bytesRead } = await fd.read(buffer, 0, 12, 0);

    if (bytesRead >= 12) {
      // Check for WebP: 'RIFF' (0x52, 0x49, 0x46, 0x46) and 'WEBP' (0x57, 0x45, 0x42, 0x50)
      const isRiff = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;
      const isWebp = buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
      if (isRiff && isWebp) {
        return "image/webp";
      }

      // Check for PNG: 0x89, 0x50, 0x4E, 0x47
      const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
      if (isPng) {
        return "image/png";
      }

      // Check for GIF: 'GIF8' (0x47, 0x49, 0x46, 0x38)
      const isGif = buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38;
      if (isGif) {
        return "image/gif";
      }
    }

    if (bytesRead >= 3) {
      // Check for JPEG: 0xFF, 0xD8, 0xFF
      const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
      if (isJpeg) {
        return "image/jpeg";
      }
    }
  } catch (err) {
    console.error("Error sniffing image content type:", err);
  } finally {
    if (fd) {
      await fd.close();
    }
  }
  return "";
}

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
            files: files,
            isIdFolder: isMatchedId
          });
        }
      }
      res.json({ folders: foldersList });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get current status of a single rentals_images folder
  app.get("/api/rentals-images-status/:id", (req, res) => {
    try {
      const { id } = req.params;
      const folderPath = path.join(process.cwd(), "public", "rentals_images", id);
      if (fs.existsSync(folderPath) && fs.statSync(folderPath).isDirectory()) {
        const files = fs.readdirSync(folderPath).filter(f => !f.startsWith('.'));
        return res.json({ exists: true, count: files.length, files: files });
      } else {
        return res.json({ exists: false, count: 0, files: [] });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Direct, custom super-robust, range-supporting serving of images with correct headers to completely bypass Vite & Express sendFile MIME conflicts
  app.get("/rentals_images/:id/:filename", async (req, res) => {
    try {
      const { id, filename } = req.params;
      const filePath = path.join(process.cwd(), "public", "rentals_images", id, filename);
      if (fs.existsSync(filePath)) {
        const sniffedMime = await getImageContentType(filePath);
        const headers: Record<string, string> = {
          "Cache-Control": "no-store, no-cache, must-revalidate, private"
        };
        if (sniffedMime) {
          headers["Content-Type"] = sniffedMime;
        } else {
          // Fallback content types based on filename
          const lowerName = filename.toLowerCase();
          if (lowerName.endsWith(".png")) {
            headers["Content-Type"] = "image/png";
          } else if (lowerName.endsWith(".gif")) {
            headers["Content-Type"] = "image/gif";
          } else if (lowerName.endsWith(".webp")) {
            headers["Content-Type"] = "image/webp";
          } else {
            headers["Content-Type"] = "image/jpeg";
          }
        }
        
        res.sendFile(filePath, { headers }, (err) => {
          if (err) {
            console.error("sendFile error serving rental image:", err);
            if (!res.headersSent) {
              res.status(500).send("Error serving image file on server");
            }
          }
        });
      } else {
        res.status(404).send("Image not found on disk");
      }
    } catch (err: any) {
      console.error("Server error in image serving endpoint:", err);
      if (!res.headersSent) {
        res.status(500).send(err.message);
      }
    }
  });
  app.use(express.static(path.join(process.cwd(), "public")));

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
