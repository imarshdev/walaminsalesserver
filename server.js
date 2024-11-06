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
// Endpoint to read JSON file
app.get("/api/records", (req, res) => {
  const jsonFilePath = path.join(__dirname, "records.json");

  fs.readFile(jsonFilePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      return res.status(500).send("Error reading data");
    }
    try {
      const jsonData = JSON.parse(data);
      res.json(jsonData);
    } catch (parseErr) {
      console.error("Error parsing JSON:", parseErr);
      res.status(500).send("Error parsing data");
    }
  });
});
// Endpoint to read JSON file
app.get("/api/products", (req, res) => {
  const jsonFilePath = path.join(__dirname, "products.json");

  fs.readFile(jsonFilePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      return res.status(500).send("Error reading data");
    }
    try {
      const jsonData = JSON.parse(data);
      res.json(jsonData);
    } catch (parseErr) {
      console.error("Error parsing JSON:", parseErr);
      res.status(500).send("Error parsing data");
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
