const express = require("express");
const fs = require("fs").promises;
const path = require("path");

const router = express.Router();
const productsFilePath = path.join(__dirname, "../products.json");

const readProductsFile = async () => {
  try {
    const data = await fs.readFile(productsFilePath);
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading products file:", err);
    return [];
  }
};

const writeProductsFile = async (data) => {
  try {
    await fs.writeFile(productsFilePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error writing products file:", err);
  }
};

router.get("/", async (req, res) => {
  const products = await readProductsFile();
  res.json(products);
});

router.put("/:name", async (req, res) => {
  const { name } = req.params;
  const { quantityChange } = req.body;

  if (typeof quantityChange !== "number") {
    return res.status(400).json({ message: "Invalid quantity change" });
  }

  const products = await readProductsFile();
  const productIndex = products.findIndex((prod) => prod.name === name);

  if (productIndex === -1) {
    return res.status(404).json({ message: "Product not found" });
  }

  products[productIndex].quantity += quantityChange;
  await writeProductsFile(products);
  res.json(products[productIndex]);
});

router.post("/", async (req, res) => {
  const { name, quantity } = req.body;

  if (!name || !quantity) {
    return res.status(400).json({ message: "Name and quantity are required" });
  }

  const products = await readProductsFile();
  const productExists = products.find((prod) => prod.name === name);

  if (productExists) {
    return res.status(400).json({ message: "Product already exists" });
  }

  const newProduct = { name, quantity: quantity || 0 };
  products.push(newProduct);
  await writeProductsFile(products);
  res.status(201).json(newProduct);
});

module.exports = router;
