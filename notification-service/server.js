// Notification Service (Port 3004)
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

let notifications = [
  { id: 'notif-1', orderId: 'ORD-101', subject: 'Order Confirmed', status: 'DELIVERED' }
];

// Health check endpoint
app.get('/health', (req, res) => res.json({ status: 'UP' }));

// Listen for order completed event
app.post('/events/order-completed', (req, res) => {
  let { orderId, total, customerName = 'Customer' } = req.body;
  let notif = {
    id: `notif-${Date.now()}`,
    orderId,
    subject: `Order #${orderId} Confirmed - Cake Delight`,
    message: `Hello ${customerName}, your order (Rs ${total}) is confirmed!`,
    status: 'DELIVERED',
    time: new Date().toLocaleTimeString()
  };
  notifications.unshift(notif);
  res.status(201).json({ message: 'Notification delivered', notif });
});

// View all sent notifications
app.get('/notifications', (req, res) => res.json(notifications));

app.listen(process.env.PORT || 3004, () => {
  console.log('Notification Service running on port 3004');
});
