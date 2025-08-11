require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const Razorpay = require('razorpay');

const app = express();
app.use(express.json());

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

/**
 * WhatsApp Cloud API Webhook Verification
 * Meta sends GET request here when setting up webhook
 */
app.get('/webhook/whatsapp', (req, res) => {
  const verifyToken = process.env.VERIFY_TOKEN;
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('WEBHOOK VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// WhatsApp incoming messages
app.post('/webhook/whatsapp', (req, res) => {
  console.log('Incoming message:', JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

// Razorpay webhook (to verify payments)
app.post('/webhook/razorpay', (req, res) => {
  console.log('Razorpay webhook data:', req.body);
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
