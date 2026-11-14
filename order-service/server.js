// Order and Basket Service (Port 3002)
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

let basket = [];
let orders = [];
const NOTIF_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://127.0.0.1:3004';

// Health check endpoint
app.get('/health', (req, res) => res.json({ status: 'UP' }));

// Get basket contents and calculated summary
app.get('/basket', (req, res) => {
  let subtotal = basket.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  let deliveryFee = subtotal > 0 ? 50 : 0;
  res.json({
    items: basket,
    summary: { itemCount: basket.reduce((s, i) => s + i.quantity, 0), subtotal, deliveryFee, total: subtotal + deliveryFee }
  });
});

// Add item to shopping basket
app.post('/basket/items', (req, res) => {
  let { cakeId, name, price, quantity = 1 } = req.body;
  let item = basket.find(i => i.cakeId === cakeId);
  if (item) {
    item.quantity += Number(quantity);
  } else {
    basket.push({ cakeId, name, price: Number(price), quantity: Number(quantity) });
  }
  res.json(basket);
});

// Remove item from basket
app.delete('/basket/items/:cakeId', (req, res) => {
  basket = basket.filter(i => i.cakeId !== req.params.cakeId);
  res.json(basket);
});

// Clear all basket items
app.delete('/basket', (req, res) => {
  basket = [];
  res.json(basket);
});

// Create order and trigger notification event
app.post('/checkout', async (req, res) => {
  if (!basket.length) return res.status(400).json({ error: 'Basket is empty' });

  let subtotal = basket.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  let order = {
    orderId: 'ORD-' + Date.now(),
    customerName: req.body.customerName || 'Rohith Kumar',
    items: [...basket],
    subtotal,
    deliveryFee: 50,
    total: subtotal + 50,
    status: 'CONFIRMED'
  };

  orders.unshift(order);
  basket = [];

  // Notify the notification service
  try {
    await fetch(`${NOTIF_URL}/events/order-completed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
  } catch (err) {}

  res.status(201).json({ message: 'Order created', order });
});

// View all orders
app.get('/orders', (req, res) => res.json(orders));

app.listen(process.env.PORT || 3002, () => {
  console.log('Order Service running on port 3002');
});
