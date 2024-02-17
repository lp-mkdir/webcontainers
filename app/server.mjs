import express from "express";
import path from "path";
import multer from "multer";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = 3000;

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, 'app/public/uploads/')
  },
  filename: function (_req, file, cb) {
    cb(null, file.originalname)
  }
})
const upload = multer({storage: storage})

// Middleware to set COOP, COEP, and CORP headers
app.use((_req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

// Middleware to serve static files from 'public' directory
app.use(express.static("app/public"));

// Route to display the sandbox UI
app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Route for file uploads
app.post("/upload", upload.single("file"), (req, res) => {
  console.log("File uploaded:", req.file);
  // You might want to send back a response that includes the file path or a success message
  res.json({ message: "File uploaded successfully", filePath: req.file.path });
});

// Placeholder route for executing user code
// This will need to be implemented according to your security and functionality requirements
app.post("/run", (_req, res) => {
  // Placeholder: execute user code here
  // Be very cautious with executing user-supplied code to avoid security risks
  res.json({ message: "Code execution feature needs to be implemented" });
});

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
