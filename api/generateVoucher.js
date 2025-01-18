// api/generateVoucher.js
const express = require('express');
const app = express();
app.use(express.json()); // To parse JSON requests

// Your API key (you can store this in an environment variable instead of hardcoding)
const API_KEY = 'ajcjsckjsaJF9183991E2tU9F9QF=CJOCJIc'; 

// Function to generate a random PIN
function generateRandomPin() {
  return Math.floor(1000_0000_0000_0000 + Math.random() * 9000_0000_0000_0000).toString();
}

// Voucher generation logic with API key check
app.post('/api/generateVoucher', (req, res) => {
  // Check for API key in the request headers
  const requestApiKey = req.headers['x-api-key'];

  if (requestApiKey !== API_KEY) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { amount, cashierName, cashierId, storeName } = req.body;

  // Check for required fields
  if (!amount || !cashierName || !cashierId || !storeName) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  // Voucher calculation logic
  const transactionFee = 20.0;
  const finalAmount = amount - transactionFee;
  const currentTime = new Date();
  const date = currentTime.toISOString().split('T')[0]; // YYYY-MM-DD
  const time = currentTime.toISOString().split('T')[1].split('.')[0]; // HH:mm:ss

  const voucher = {
    pin: generateRandomPin(),
    serialNumber: `SN${Date.now()}`,
    originalAmount: amount,
    transactionFee,
    finalAmount,
    date,
    time,
    cashierName,
    cashierId,
    storeName
  };

  res.status(201).json(voucher); // Return the generated voucher
});

module.exports = app;
