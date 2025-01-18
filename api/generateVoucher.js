const express = require('express');
const app = express();
app.use(express.json()); // to parse JSON requests

// Function to generate a random PIN
function generateRandomPin() {
  return Math.floor(1000_0000_0000_0000 + Math.random() * 9000_0000_0000_0000).toString();
}

// Define the voucher generation logic
app.post('/api/generateVoucher', (req, res) => {
  try {
    const { amount, cashierName, cashierId, storeName } = req.body;

    if (!amount || !cashierName || !cashierId || !storeName) {
      return res.status(400).json({ error: "Missing required fields." });
    }

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

    res.status(201).json(voucher);
  } catch (error) {
    console.error("Error generating voucher:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = app;
