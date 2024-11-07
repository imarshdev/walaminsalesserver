// server.js
const express = require("express");
PORT = 5000;
const app = express();

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
