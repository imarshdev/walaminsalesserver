const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const recordsRoutes = require("./routes/records");
const productsRoutes = require("./routes/products");

const app = express();
const PORT = 5000;

// Allow requests from all origins
app.use(cors());

// Middleware
app.use(bodyParser.json());
app.use("/api/records", recordsRoutes);
app.use("/api/products", productsRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
