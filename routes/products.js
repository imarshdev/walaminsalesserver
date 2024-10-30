// routes/products.js
const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();
const productsFilePath = path.join(__dirname, "../products.json");

// Helper function to read products.json
const readProductsFile = () => {
  try {
    const data = fs.readFileSync(productsFilePath);
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
};

// Helper function to write to products.json
const writeProductsFile = (data) => {
  fs.writeFileSync(productsFilePath, JSON.stringify(data, null, 2));
};

// GET all products
router.get("/", (req, res) => {
  const products = readProductsFile();
  res.json(products);
});

// PUT (update) product quantity by name
router.put("/:name", (req, res) => {
  const { name } = req.params;
  const { quantityChange } = req.body;
  const products = readProductsFile();

  const productIndex = products.findIndex((prod) => prod.name === name);

  if (productIndex === -1) {
    return res.status(404).json({ message: "Product not found" });
  }

  // Update the product quantity
  products[productIndex].quantity += quantityChange;
  writeProductsFile(products);
  res.json(products[productIndex]);
});

// POST (add) a new product
router.post("/", (req, res) => {
  const { name, quantity } = req.body; // Extract name and quantity from the request body
  const products = readProductsFile();

  // Check if the product already exists
  const productExists = products.find((prod) => prod.name === name);
  if (productExists) {
    return res.status(400).json({ message: "Product already exists" });
  }

  // Create a new product object
  const newProduct = {
    name: name,
    quantity: quantity || 0, // Default to 0 if quantity is not provided
  };

  // Add the new product to the array
  products.push(newProduct);
  writeProductsFile(products); // Write the updated product list to products.json
  res.status(201).json(newProduct); // Return the newly created product
});

module.exports = router;

