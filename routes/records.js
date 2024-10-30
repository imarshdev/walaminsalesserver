// routes/records.js
const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();
const recordsFilePath = path.join(__dirname, "../records.json");

// Helper function to read records.json
const readRecordsFile = () => {
  try {
    const data = fs.readFileSync(recordsFilePath);
    return JSON.parse(data);
  } catch (err) {
    return { incomingRecords: [], outgoingRecords: [] };
  }
};

// Helper function to write to records.json
const writeRecordsFile = (data) => {
  fs.writeFileSync(recordsFilePath, JSON.stringify(data, null, 2));
};

// GET all incoming records
router.get("/", (req, res) => {
  const records = readRecordsFile();
  res.json(records);
});

// POST a new incoming record
router.post("/incoming", (req, res) => {
  const records = readRecordsFile();
  const newRecord = req.body;
  records.incomingRecords.push(newRecord);
  writeRecordsFile(records);
  res.status(201).json(newRecord);
});

// PUT (update) an incoming record by ID
router.put("/incoming/:id", (req, res) => {
  const { id } = req.params;
  const updatedRecord = req.body;
  const records = readRecordsFile();
  const recordIndex = records.incomingRecords.findIndex((rec) => rec.id === id);

  if (recordIndex === -1) {
    return res.status(404).json({ message: "Record not found" });
  }

  records.incomingRecords[recordIndex] = {
    ...records.incomingRecords[recordIndex],
    ...updatedRecord,
  };
  writeRecordsFile(records);
  res.json(updatedRecord);
});

// POST a new outgoing record
router.post("/outgoing", (req, res) => {
  const records = readRecordsFile();
  const newRecord = req.body;
  records.outgoingRecords.push(newRecord);
  writeRecordsFile(records);
  res.status(201).json(newRecord);
});

// PUT (update) an outgoing record by ID
router.put("/outgoing/:id", (req, res) => {
  const { id } = req.params;
  const updatedRecord = req.body;
  const records = readRecordsFile();
  const recordIndex = records.outgoingRecords.findIndex((rec) => rec.id === id);

  if (recordIndex === -1) {
    return res.status(404).json({ message: "Record not found" });
  }

  records.outgoingRecords[recordIndex] = {
    ...records.outgoingRecords[recordIndex],
    ...updatedRecord,
  };
  writeRecordsFile(records);
  res.json(updatedRecord);
});

// Add this endpoint at the bottom of your routes/records.js file

// GET endpoint to download the JSON file
router.get("/download", (req, res) => {
    // Get the current date
    const currentDate = new Date();
    
    // Format the date as MM-DD-YYYY
    const formattedDate = currentDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).replace(/\//g, "-"); // Replace slashes with dashes
  
    // Create the filename with the current date
    const filename = `records-${formattedDate}.json`;
  
    res.download(recordsFilePath, filename, (err) => {
      if (err) {
        res.status(500).json({ error: "Failed to download file" });
      }
    });
  });

module.exports = router;
