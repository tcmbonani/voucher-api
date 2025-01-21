const express = require("express");
const admin = require("firebase-admin");
const app = express();
app.use(express.json()); // To parse JSON requests

// Initialize Firebase Admin SDK with service account credentials
const serviceAccount = require("/voucher-api/google-services.json"); // Path to your downloaded service account JSON file

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Function to generate a random PIN
function generateRandomPin() {
  return Math.floor(1000_0000_0000_0000 + Math.random() * 9000_0000_0000_0000).toString();
}

// Voucher generation route
app.post("https://firestore.googleapis.com/v1/projects/depozitha-merchants/databases/(default)/documents/users", async (req, res) => {
  const authHeader = req.headers.authorization;

  // Check if Authorization header is present and valid
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(403).json({ error: "Unauthorized: Missing or Invalid Authorization Header" });
  }

  // Extract the ID Token from the header
  const idToken = authHeader.split("Bearer ")[1].trim();

  try {
    // Verify the ID token using Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid; // Firebase user UID

    // Extract required fields from the request body
    const { amount, cashierName, cashierId, storeName } = req.body;

    // Validate the request body
    if (!amount || !cashierName || !cashierId || !storeName) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // Business logic to calculate the voucher details
    const transactionFee = 20.0;
    const finalAmount = amount - transactionFee;
    const currentTime = new Date();
    const date = currentTime.toISOString().split("T")[0]; // YYYY-MM-DD
    const time = currentTime.toISOString().split("T")[1].split(".")[0]; // HH:mm:ss

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
      storeName,
      uid,
    };

    // Save voucher to Firestore
    const firestore = admin.firestore();
    const voucherRef = await firestore.collection("vouchers").add(voucher);

    // Respond with the voucher details and Firestore document ID
    res.status(201).json({
      message: "Voucher created successfully.",
      voucherId: voucherRef.id,
      voucher,
    });
  } catch (error) {
    console.error("Error verifying token or saving voucher:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
