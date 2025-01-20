const express = require('express');
const admin = require('firebase-admin');
const app = express();
app.use(express.json()); // To parse JSON requests

// Initialize Firebase Admin SDK with service account credentials
const serviceAccount = require('/voucher-api/google-services.json'); // Path to your downloaded service account JSON file

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Function to generate a random PIN
function generateRandomPin() {
  return Math.floor(1000_0000_0000_0000 + Math.random() * 9000_0000_0000_0000).toString();
}

// Voucher generation logic with Firebase Authentication
app.post('https://firestore.googleapis.com/v1/projects/depozitha-merchants/databases/(default)/documents/users?key=AIzaSyDyeIv7uaQumQ_gModXmK70ZFYI2TCP5Q8', async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer')) {
    return res.status(403).json({ error: 'Unauthorized, Missing or Invalid Authorization Header' });
  }

  const idToken = authHeader.split('Bearer')[1].trim(); // Make sure to trim spaces

  try {
    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid; // You can use this UID to verify the user's identity

    // Continue with your voucher generation logic
    const { amount, cashierName, cashierId, storeName } = req.body;

    if (!amount || !cashierName || !cashierId || !storeName) {
      return res.status(400).json({ error: 'Missing required fields.' });
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
      storeName,
      uid
    };

    res.status(201).json(voucher); // Return the generated voucher
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(403).json({ error: 'Unauthorized or invalid token.' });
  }
});

module.exports = app;
