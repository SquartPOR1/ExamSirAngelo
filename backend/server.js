const express = require("express");
const path = require("path");

// =====================================================
// BACKEND SERVER - PORT 3000
// =====================================================

const backend = express();

backend.use(express.json());

backend.get("/", (req, res) => {
  res.json({
    message: "Backend server is running!"
  });
});

backend.listen(3000, () => {
  console.log("Backend server running at http://localhost:3000");
});


// =====================================================
// STUDENT DATA API - PORT 3001
// =====================================================

const studentApi = express();

studentApi.use(express.json());

studentApi.get("/", (req, res) => {
  res.json([
    {
      id: 1,
      name: "Juan",
      course: "BSIT"
    },
    {
      id: 2,
      name: "Maria",
      course: "BSIT"
    },
    {
      id: 3,
      name: "Pedro",
      course: "BSCS"
    }
  ]);
});

studentApi.listen(3001, () => {
  console.log("Student API running at http://localhost:3001");
});


// =====================================================
// VITE BUILD / FRONTEND - PORT 3002
// =====================================================

const frontend = express();

// Location of Vite's production build
const frontendPath = path.join(__dirname, "..", "dist");

// Serve CSS, JavaScript, images, etc.
frontend.use(express.static(frontendPath));

// React/Vite fallback
frontend.use((req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

frontend.listen(3002, () => {
  console.log("Frontend running at http://localhost:3002");
});
