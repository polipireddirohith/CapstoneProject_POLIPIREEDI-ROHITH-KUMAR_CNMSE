// Notification Microservice (Port 3004)
const express = require('express');
const cors = require('cors');
const amqp = require('amqplib');
const app = express();

app.use(cors());
app.use(express.json());

// ==============================================================================
// DATABASE INTEGRATION (Polyglot Persistence: MongoDB / Redis for Notification Logs)
// To activate: 1) npm i mongoose  2) uncomment the lines below
// const mongoose = require('mongoose');
// mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/notifications_db');
// const Notif = mongoose.model('Notification', new mongoose.Schema({ orderId: String, subject: String, status: String, time: String }));
// ==============================================================================

let notifications = [
  { id: 'notif-1', orderId: 'ORD-101', subject: 'Order #ORD-101 Confirmed', status: 'DELIVERED', time: '10:00:00 AM' }
];

// Helper to format and store the in-app confirmation notification
function recordNotification(event) {
  let notif = {
    id: `notif-${Date.now()}`,
    orderId: event.orderId,
    recipientEmail: event.email || 'customer@example.com',
    subject: `Order #${event.orderId} Confirmed - Cake Delight`,
    message: `Hello ${event.customerName || 'Customer'}, your order (₹${event.total}) is confirmed!`,
    status: 'DELIVERED',
    time: new Date().toLocaleTimeString()
  };
  notifications.unshift(notif);
  console.log(`[Notification Service] Logged notification for Order: ${event.orderId}`);
  return notif;
}

// Asynchronous Consumer: Listen for order completion events via RabbitMQ
(async function startRabbitMQConsumer() {
  try {
    const conn = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://127.0.0.1:5672');
    const ch = await conn.createChannel();
    await ch.assertQueue('cake_order_completed', { durable: true });
    console.log('[Notification Service] Listening on RabbitMQ queue: cake_order_completed');
    ch.consume('cake_order_completed', msg => {
      if (msg) {
        recordNotification(JSON.parse(msg.content.toString()));
        ch.ack(msg);
      }
    });
  } catch (err) {
    console.log('[Notification Service] RabbitMQ unavailable, ready for HTTP events.');
  }
})();

// Health check endpoint
app.get('/health', (req, res) => res.json({ status: 'UP', service: 'notification-service' }));

// HTTP Webhook Fallback Endpoint for order completed events
app.post('/events/order-completed', (req, res) => {
  const notif = recordNotification(req.body);
  res.status(201).json({ message: 'Notification delivered', notif });
});

// View all sent notifications with delivery status
app.get('/notifications', (req, res) => res.json(notifications));

app.listen(process.env.PORT || 3004, () => {
  console.log('Notification Service running on port 3004');
});
