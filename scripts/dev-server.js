const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(rootDir, "apps", "web", "public");
const port = Number(process.env.PORT) || 5173;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mp4": "video/mp4",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon"
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  const pathname = decodeURIComponent(parsedUrl.pathname || "/");
  const safePath = pathname === "/" ? "/index.html" : pathname;
  const relativePath = safePath.replace(/^\/+/, "");
  const rootPath = path.resolve(rootDir, relativePath);
  const publicPath = path.resolve(publicDir, relativePath);

  if (!rootPath.startsWith(rootDir) || !publicPath.startsWith(publicDir)) {
    res.statusCode = 400;
    res.end("Bad request");
    return;
  }

  const candidates = [rootPath, publicPath];
  const serveFile = (filePath) => {
    const ext = path.extname(filePath);
    res.setHeader("Content-Type", mimeTypes[ext] || "text/plain; charset=utf-8");
    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        res.statusCode = 500;
        res.end("Server error");
        return;
      }
      res.statusCode = 200;
      res.end(data);
    });
  };

  const tryNext = (index) => {
    if (index >= candidates.length) {
      res.statusCode = 404;
      res.end("Not found");
      return;
    }
    const filePath = candidates[index];
    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        tryNext(index + 1);
        return;
      }
      serveFile(filePath);
    });
  };

  tryNext(0);
});

server.listen(port, () => {
  console.log(`UI server running at http://localhost:${port}`);
});
