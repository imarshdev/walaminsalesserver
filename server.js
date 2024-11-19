// server.js
const express = require("express");
require("dotenv").config();
const bodyParser = require("body-parser");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const PORT = 5000;

const uri = process.env.MONGO_URI;

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
  // done
  try {
    const productsCollection = db.collection("products");
    const products = await productsCollection.find().toArray();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Error retrieving products" });
  }
});

// Delete a product by name
app.delete("/api/products/:name", async (req, res) => {
  // not done
  const { name } = req.params;

  try {
    const productsCollection = db.collection("products");
    const result = await productsCollection.deleteOne({ name });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting product", error: err.message });
  }
});

app.put("/api/products/:name", async (req, res) => {
  // done
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

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    const updatedProduct = await productsCollection.findOne({ name });
    res.json(updatedProduct);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Error updating product", error: err.message });
  }
});

app.post("/api/products", async (req, res) => {
  // done
  const { name, quantity, costPrice, supplier, supplierContact } = req.body;

  if (!name || quantity == null || costPrice == null || !supplier) {
    return res.status(400).json({
      message:
        "Name, quantity, cost price, sales price, and supplier are required",
    });
  }

  const newProduct = {
    name,
    quantity,
    costPrice,
    supplier,
    supplierContact,
  };

  try {
    const productsCollection = db.collection("products");
    const result = await productsCollection.insertOne(newProduct);
    const insertedProduct = await productsCollection.findOne({
      _id: result.insertedId,
    });
    res.status(201).json(insertedProduct);
  } catch (err) {
    console.error("Error saving product:", err);
    res
      .status(400)
      .json({ message: "Error saving product", error: err.message });
  }
});

// Bulk import/export products
app.post("/api/products/bulk", async (req, res) => {
  // not done
  const { products } = req.body;

  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ message: "Invalid product list" });
  }

  try {
    const productsCollection = db.collection("products");
    const result = await productsCollection.insertMany(products);
    res.status(201).json({ message: "Bulk import successful", result });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error performing bulk operation", error: err.message });
  }
});

// Get records with dynamic filters
app.get("/api/records", async (req, res) => {
  // done
  const filters = req.query;
  let query = {};

  for (let key in filters) {
    if (filters[key]) {
      if (key === "date") {
        const date = new Date(filters[key]);
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);

        query[key] = {
          $gte: date.toISOString(),
          $lt: nextDay.toISOString(),
        };
      } else {
        query[key] = filters[key];
      }
    }
  }

  try {
    const recordsCollection = db.collection("records");
    const records = await recordsCollection.find(query).toArray();
    res.json(records);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error retrieving records", error: err.message });
  }
});

app.post("/api/records/:type", async (req, res) => {
  // done
  const { type } = req.params;
  const newRecord = { ...req.body, type };

  try {
    const recordsCollection = db.collection("records");
    const result = await recordsCollection.insertOne(newRecord);
    const insertedRecord = await recordsCollection.findOne({
      _id: result.insertedId,
    });
    res.status(201).json(insertedRecord);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Error saving record", error: err.message });
  }
});

app.put("/api/records/:type/:id", async (req, res) => {
  // done
  const { id } = req.params;

  try {
    const recordsCollection = db.collection("records");
    const updatedRecord = await recordsCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: req.body },
      { returnDocument: "after" }
    );

    if (!updatedRecord.value) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.json(updatedRecord.value);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Error updating record", error: err.message });
  }
});

// Delete a record by ID
app.delete("/api/records/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const recordsCollection = db.collection("records");
    const result = await recordsCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.json({ message: "Record deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting record", error: err.message });
  }
});

app.get("/api/records/download", async (req, res) => {
  // not done
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

// Get stats for incoming and outgoing records
app.get("/api/records/stats", async (req, res) => {
  // not done
  try {
    const recordsCollection = db.collection("records");

    // Aggregate stats by type
    const stats = await recordsCollection
      .aggregate([{ $group: { _id: "$type", count: { $sum: 1 } } }])
      .toArray();

    res.json(stats);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error retrieving stats", error: err.message });
  }
});

// Customer routes
app.post("/api/customers", async (req, res) => {
  // done
  const { name, business, location, contact } = req.body;

  if (!name || !business || !location) {
    return res
      .status(400)
      .json({ message: "Name, business, and location are required" });
  }

  const newCustomer = { name, business, location, contact };

  try {
    const customersCollection = db.collection("customers");
    const result = await customersCollection.insertOne(newCustomer);
    const insertedCustomer = await customersCollection.findOne({
      _id: result.insertedId,
    });
    res.status(201).json(insertedCustomer);
  } catch (err) {
    console.error("Error saving customer:", err);
    res
      .status(400)
      .json({ message: "Error saving customer", error: err.message });
  }
});

app.get("/api/customers", async (req, res) => {
  // done
  try {
    const customersCollection = db.collection("customers");
    const customers = await customersCollection.find().toArray();
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: "Error retrieving customers" });
  }
});

app.put("/api/customers/:id", async (req, res) => {
  const { id } = req.params;
  const { name, business, location, contact } = req.body;

  if (!name || !business || !location) {
    return res.status(400).json({
      message: "Name, business, and location are required",
    });
  }

  // editing a customer
  try {
    const customersCollection = db.collection("customers");
    const result = await customersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { name, business, location, contact } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.status(200).json({ message: "Customer updated successfully" });
  } catch (err) {
    console.error("Error updating customer:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});


// Delete a customer by ID
app.delete("/api/customers/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const customersCollection = db.collection("customers");
    const result = await customersCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json({ message: "Customer deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting customer", error: err.message });
  }
});


// Search for customers with filters
app.get("/api/customers/search", async (req, res) => {
  // not done
  const filters = req.query;

  try {
    const customersCollection = db.collection("customers");
    const customers = await customersCollection.find(filters).toArray();
    res.json(customers);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error searching customers", error: err.message });
  }
});

// Fetch dashboard stats (e.g., total products, records, customers)
app.get("/api/dashboard/stats", async (req, res) => {
  // not done
  try {
    const productsCollection = db.collection("products");
    const recordsCollection = db.collection("records");
    const customersCollection = db.collection("customers");

    const [productCount, recordCount, customerCount] = await Promise.all([
      productsCollection.countDocuments(),
      recordsCollection.countDocuments(),
      customersCollection.countDocuments(),
    ]);

    res.json({
      totalProducts: productCount,
      totalRecords: recordCount,
      totalCustomers: customerCount,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error retrieving dashboard stats",
      error: err.message,
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
