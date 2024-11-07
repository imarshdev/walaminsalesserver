// server.js
const express = require("express");
const app = express();
const PORT = 5000;

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
