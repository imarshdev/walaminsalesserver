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



app.get('/stats', async (req, res) => {
  try {
    const productsCollection = db.collection('products');
    const customersCollection = db.collection('customers');
    const recordsCollection = db.collection('records');

    // Total Counts
    const totalProducts = await productsCollection.countDocuments();
    const totalCustomers = await customersCollection.countDocuments();
    const totalRecords = await recordsCollection.countDocuments();

    // Best-selling Products
    const bestSellingProducts = await recordsCollection.aggregate([
      {
        $match: { type: "outgoing" } // Focus only on outgoing records
      },
      {
        $group: {
          _id: "$name", // Group by product name
          totalSold: { $sum: "$quantity" } // Calculate the total quantity sold
        }
      },
      { $sort: { totalSold: -1 } }, // Sort by totalSold in descending order
      { $limit: 5 } // Get the top 5 best-selling products
    ]).toArray();
    
    console.log("Best-Selling Products:", bestSellingProducts);
    

    // Top Customers
    const topCustomers = await recordsCollection.aggregate([
      {
        $match: { type: "outgoing" } // Focus only on outgoing records
      },
      {
        $group: {
          _id: "$supplier", // Group by supplier
          totalSpent: { $sum: "$cost" } // Calculate total spent
        }
      },
      { $sort: { totalSpent: -1 } }, // Sort by totalSpent in descending order
      { $limit: 5 } // Get the top 5 customers
    ]).toArray();
    
    console.log("Top Customers:", topCustomers);
    

    const bestSellingProductsWithDetails = await recordsCollection.aggregate([
      { $match: { type: "outgoing" } },
      {
        $group: {
          _id: "$name",
          totalSold: { $sum: "$quantity" }
        }
      },
      {
        $lookup: {
          from: "products", // Name of the products collection
          localField: "_id", // Field in the records collection
          foreignField: "name", // Field in the products collection
          as: "productDetails"
        }
      },
      { $unwind: "$productDetails" }, // Unwind the productDetails array
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ]).toArray();
    
    console.log("Best-Selling Products with Details:", bestSellingProductsWithDetails);
      
    
    const topCustomersWithDetails = await recordsCollection.aggregate([
      { $match: { type: "outgoing" } },
      {
        $group: {
          _id: "$supplier",
          totalSpent: { $sum: { $multiply: ["$quantity", "$cost"] } }
        }
      },
      {
        $lookup: {
          from: "customers", // Name of the customers collection
          localField: "_id", // Field in the records collection
          foreignField: "name", // Field in the customers collection
          as: "customerDetails"
        }
      },
      { $unwind: "$customerDetails" }, // Unwind the customerDetails array
      { $sort: { totalSpent: -1 } },
      { $limit: 5 }
    ]).toArray();
    
    console.log("Top Customers with Details:", topCustomersWithDetails);
    

    res.json({
      totalProducts,
      totalCustomers,
      totalRecords,
      bestSellingProducts,
      topCustomers,
      bestSellingProductsWithDetails,
      topCustomersWithDetails
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Error fetching stats' });
  }
});



app.get('/products/stats', async (req, res) => {
  try {
    const productsCollection = db.collection('products');
    const recordsCollection = db.collection('records');

    // Fetch all products
    const products = await productsCollection.find().toArray();
    if (!products || products.length === 0) return res.status(404).json({ message: 'No products found' });

    // Fetch stats for each product
    const productStats = await Promise.all(products.map(async (product) => {
      // Fetch Incoming (Restock) History for each product
      const incomingHistory = await recordsCollection.find({
        type: 'incoming',
        name: product.name,
      }).sort({ date: 1 }).toArray();

      // Fetch Outgoing (Sales) History for each product
      const outgoingHistory = await recordsCollection.find({
        type: 'outgoing',
        name: product.name,
      }).sort({ date: 1 }).toArray();

      // Calculate Cumulative Stock for Graph
      const cumulativeStock = [];
      let totalStock = 0;

      // Merge and Sort by Date
      const transactions = [...incomingHistory, ...outgoingHistory].sort((a, b) => new Date(a.date) - new Date(b.date));

      transactions.forEach((record) => {
        const quantity = record.type === 'incoming' ? record.quantity : -record.quantity;
        totalStock += quantity;
        cumulativeStock.push({
          date: record.date,
          type: record.type,
          quantity: record.quantity,
          totalStock,
        });
      });

      // Prepare Consecutive Frequency
      const restockFrequency = incomingHistory.length;
      const consecutiveFrequency = incomingHistory.map((record, index, arr) => {
        const previousTotal = index === 0 ? product.quantity : arr[index - 1].quantity;
        const change = record.quantity - previousTotal;
        return {
          date: record.date,
          added: change,
          cumulative: record.quantity,
        };
      });

      return {
        product,
        totalStock,
        incomingHistory,
        outgoingHistory,
        cumulativeStock, // For graphing
        consecutiveFrequency,
        restockFrequency,
      };
    }));

    // Send the stats for all products
    res.json(productStats);
  } catch (error) {
    console.error('Error fetching product stats:', error);
    res.status(500).json({ message: 'Error fetching product stats' });
  }
});

app.get('/customers/stats', async (req, res) => {
  try {
    const customersCollection = db.collection('customers');
    const recordsCollection = db.collection('records');
    const productsCollection = db.collection('products');

    // Fetch all customers
    const customers = await customersCollection.find().toArray();
    if (!customers || customers.length === 0) return res.status(404).json({ message: 'No customers found' });

    // Fetch stats for each customer
    const customerStats = [];

    for (const customer of customers) {
      // Fetch all records for this customer, filtering for 'outgoing' type only
      const customerRecords = await recordsCollection.find({ customerId: customer._id, type: 'outgoing' }).toArray();

      const totalSpent = customerRecords.reduce((sum, record) => {
        if (record.type === 'outgoing') {
          return sum + (record.cost || 0);  // Add the cost directly without multiplying by quantity
        }
        return sum;
      }, 0);

      // Calculate total records (outgoing records only)
      const totalRecords = customerRecords.length;

      // Fetch product details for each outgoing record
      const productDetails = await Promise.all(customerRecords.map(async (record) => {
        const product = await productsCollection.findOne({ name: record.name });
        return {
          name: record.name,
          quantity: record.quantity,
          cost: record.cost,
          totalCost: record.cost * record.quantity,  // Total cost for this record
          supplier: record.supplier,
          productDetails: product ? product : {},
        };
      }));

      customerStats.push({
        customer,
        totalSpent,
        totalRecords,
        productDetails,  // Product details for each outgoing record
      });
    }

    res.json(customerStats);
  } catch (error) {
    console.error('Error fetching customer stats:', error);
    res.status(500).json({ message: 'Error fetching customer stats' });
  }
});



// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
