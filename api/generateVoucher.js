const express = require("express");
const admin = require("firebase-admin");
const app = express();
app.use(express.json());
require("dotenv").config();

// Initialize Firebase Admin
const firebaseAdminCredentials = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);

admin.initializeApp({
  credential: admin.credential.cert(firebaseAdminCredentials),
});

// Function to generate a random PIN
function generateRandomPin() {
  return Math.floor(1000_0000_0000_0000 + Math.random() * 9000_0000_0000_0000).toString();
}

// Voucher generation route
app.post("/vouchers", async (req, res) => {
  const authHeader = req.headers.authorization;

  // Check if Authorization header is present and valid
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(403).json({ error: "Unauthorized: Missing or Invalid Authorization Header" });
  }

  const idToken = authHeader.split("Bearer ")[1].trim();

  try {
    // Verify the ID token using Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const { amount, cashierName, cashierId, storeName } = req.body;

    // Validate the request body
    if (!amount || !cashierName || !cashierId || !storeName) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const transactionFee = 20.0;
    const finalAmount = amount - transactionFee;
    const currentTime = new Date();
    const date = currentTime.toISOString().split("T")[0];
    const time = currentTime.toISOString().split("T")[1].split(".")[0];

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
