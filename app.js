const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 5000;

// 🔥 YOUR UNITY PROJECT FOLDER
const STORAGE_DIR = "C:/Users/muaav/OneDrive/Desktop/corebit/MediFlow/Assets";

// Create folder if not exist (optional safety)
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
  console.log("Created Unity Assets folder (if missing)");
}

const MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".json": "application/json",
};

const BASE = __dirname;

const server = http.createServer((req, res) => {
  if (req.url === "/favicon.ico") {
    res.writeHead(204);
    return res.end();
  }

  // ------------ SERVE STATIC ------------
  if (req.method === "GET") {
    const urlPath = req.url === "/" ? "/index.html" : req.url;
    const filePath = path.join(BASE, urlPath);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        return res.end("Not found");
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { "Content-Type": MIME[ext] || "text/plain" });
      res.end(data);
    });
    return;
  }

  // ------------ POST /receive ------------
  if (req.method === "POST" && req.url === "/receive") {
    let body = "";

    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const payload = JSON.parse(body);

        console.log("\n=== JSON RECEIVED ===");
        console.log(JSON.stringify(payload, null, 2));

        // FINAL SAVE PATH → Unity assets folder
        const savePath = path.join(
          STORAGE_DIR,
          "waste_data.json" // You can rename this
        );

        fs.writeFileSync(savePath, JSON.stringify(payload, null, 2));

        console.log("Saved to:", savePath);

        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            ok: true,
            savedTo: savePath,
            receivedAt: new Date().toISOString(),
          })
        );
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ ok: false, error: "Invalid JSON" }));
      }
    });

    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`Server running → http://localhost:${PORT}`);
});
