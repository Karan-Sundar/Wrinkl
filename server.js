require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const Razorpay = require('razorpay');

const app = express();
app.use(express.json());

// ===== MongoDB Connection =====
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB error:', err));

// ===== Root Route for Render =====
app.get('/', (req, res) => {
    res.status(200).send('🚀 Wrinkl Laundry WhatsApp Bot is running!');
});

// ===== WhatsApp Webhook Verification =====
app.get('/webhook/whatsapp', (req, res) => {
    console.log('🔍 Webhook verification request:', req.query);
    const verifyToken = process.env.VERIFY_TOKEN;
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === verifyToken) {
            console.log('✅ WEBHOOK VERIFIED');
            res.status(200).send(challenge);
        } else {
            console.warn('❌ Verification failed: Invalid token');
            res.sendStatus(403);
        }
    } else {
        res.sendStatus(400);
    }
});

// ===== WhatsApp Incoming Messages =====
app.post('/webhook/whatsapp', async (req, res) => {
    console.log('📩 Incoming message payload:', JSON.stringify(req.body, null, 2));

    try {
        const entry = req.body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const message = value?.messages?.[0];

        if (message) {
            const from = message.from; // User's WhatsApp number

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
            console.log("✅ Buttons sent successfully to", from);
        }
    } catch (err) {
        console.error("❌ Error handling WhatsApp message:", err.response?.data || err.message);
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
