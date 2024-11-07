// server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");

const app = express();
const PORT = 5000;

const uri =
  "mongodb+srv://forevermarsh004:zahara227..m@walamin.tu0zp.mongodb.net/?retryWrites=true&w=majority&appName=walamin";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB and get database connection
let db;
client
  .connect()
  .then(() => {
    db = client.db("walamin");
    console.log("Connected to MongoDB");
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// Products routes
app.get("/api/products", async (req, res) => {
  try {
    const productsCollection = db.collection("products");
    const products = await productsCollection.find().toArray();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Error retrieving products" });
  }
});

app.put("/api/products/:name", async (req, res) => {
  const { name } = req.params;
  const { quantityChange } = req.body;

  if (typeof quantityChange !== "number") {
    return res.status(400).json({ message: "Invalid quantity change" });
  }

  try {
    const productsCollection = db.collection("products");
    const result = await productsCollection.updateOne(
      { name },
      { $inc: { quantity: quantityChange } }
    );

    if (result.matchedCount === 0)
      return res.status(404).json({ message: "Product not found" });

    const updatedProduct = await productsCollection.findOne({ name });
    res.json(updatedProduct);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Error updating product", error: err.message });
  }
});

app.post("/api/products", async (req, res) => {
  const { name, quantity } = req.body;

  if (!name || quantity == null) {
    return res.status(400).json({ message: "Name and quantity are required" });
  }

  const newProduct = { name, quantity };

  try {
    const productsCollection = db.collection("products");
    const result = await productsCollection.insertOne(newProduct);
    res.status(201).json(result.ops[0]);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Error saving product", error: err.message });
  }
});

// Records routes
app.get("/api/records", async (req, res) => {
  try {
    const recordsCollection = db.collection("records");
    const records = await recordsCollection.find().toArray();
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: "Error retrieving records" });
  }
});

app.post("/api/records/:type", async (req, res) => {
  const { type } = req.params;
  const newRecord = { ...req.body, type };

  try {
    const recordsCollection = db.collection("records");
    const result = await recordsCollection.insertOne(newRecord);
    res.status(201).json(result.ops[0]);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Error saving record", error: err.message });
  }
});

app.put("/api/records/:type/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const recordsCollection = db.collection("records");
    const updatedRecord = await recordsCollection.findOneAndUpdate(
      { id },
      { $set: req.body },
      { returnDocument: "after" }
    );

    if (!updatedRecord.value)
      return res.status(404).json({ message: "Record not found" });

    res.json(updatedRecord.value);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Error updating record", error: err.message });
  }
});

app.get("/api/records/download", async (req, res) => {
  try {
    const recordsCollection = db.collection("records");
    const records = await recordsCollection.find().toArray();
    const data = JSON.stringify(records, null, 2);
    const filename = `records-${new Date().toISOString().slice(0, 10)}.json`;

    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "application/json");
    res.send(data);
  } catch (err) {
    res.status(500).json({ message: "Failed to download records" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
