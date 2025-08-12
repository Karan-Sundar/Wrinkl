require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const Razorpay = require('razorpay');

const app = express();
app.use(express.json());

// ===== Connect MongoDB =====
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// ===== WhatsApp Webhook Verification =====
app.get('/webhook/whatsapp', (req, res) => {
  const verifyToken = process.env.VERIFY_TOKEN;
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('✅ WEBHOOK VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

// ===== WhatsApp Incoming Messages =====
app.post('/webhook/whatsapp', async (req, res) => {
  console.log('📩 Incoming message:', JSON.stringify(req.body, null, 2));

  const entry = req.body.entry?.[0];
  const changes = entry?.changes?.[0];
  const value = changes?.value;
  const message = value?.messages?.[0];

  if (message) {
    const from = message.from; // User's WhatsApp number

    try {
      // Send interactive reply buttons
      await axios.post(
        `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: "whatsapp",
          to: from,
          type: "interactive",
          interactive: {
            type: "button",
            body: {
              text: "👋 Welcome to Wrinkl Laundry! What would you like to do?"
            },
            action: {
              buttons: [
                {
                  type: "reply",
                  reply: { id: "order_laundry", title: "🧺 Place Order" }
                },
                {
                  type: "reply",
                  reply: { id: "track_order", title: "📍 Track Order" }
                },
                {
                  type: "reply",
                  reply: { id: "contact_support", title: "💬 Contact Support" }
                }
              ]
            }
          }
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
            "Content-Type": "application/json"
          }
        }
      );
      console.log("✅ Buttons sent successfully");
    } catch (err) {
      console.error("❌ Error sending buttons:", err.response?.data || err.message);
    }
  }

  res.sendStatus(200);
});

// ===== Razorpay Webhook =====
app.post('/webhook/razorpay', (req, res) => {
  console.log('💳 Razorpay webhook data:', req.body);
  res.sendStatus(200);
});

// ===== Start Server =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
