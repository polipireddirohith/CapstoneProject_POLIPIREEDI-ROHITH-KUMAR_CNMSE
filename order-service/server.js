// Order and Basket Microservice (Port 3002)
const express = require('express');
const cors = require('cors');
const amqp = require('amqplib');
const app = express();

app.use(cors());
app.use(express.json());

let basket = [];
let orders = [];
const NOTIF_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://127.0.0.1:3004';
const RABBIT_URL = process.env.RABBITMQ_URL || 'amqp://127.0.0.1:5672';
let rabbitChannel = null;

// Asynchronous Message Broker setup (RabbitMQ) with fault-tolerant connection
(async function initRabbitMQ() {
  try {
    const conn = await amqp.connect(RABBIT_URL);
    rabbitChannel = await conn.createChannel();
    await rabbitChannel.assertQueue('cake_order_completed', { durable: true });
    console.log('[Order Service] Connected to RabbitMQ queue: cake_order_completed');
  } catch (err) {
    console.log('[Order Service] RabbitMQ unavailable, using HTTP event fallback.');
  }
})();

// Helper to publish event via RabbitMQ (primary) or HTTP fallback
async function publishOrderEvent(orderEvent) {
  if (rabbitChannel) {
    try {
      rabbitChannel.sendToQueue('cake_order_completed', Buffer.from(JSON.stringify(orderEvent)));
      console.log(`[Order Service] Published event to RabbitMQ for: ${orderEvent.orderId}`);
      return;
    } catch (e) {}
  }
  try {
    await fetch(`${NOTIF_URL}/events/order-completed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderEvent)
    });
    console.log(`[Order Service] Delivered event via HTTP fallback for: ${orderEvent.orderId}`);
  } catch (err) {}
}

// Health check endpoint
app.get('/health', (req, res) => res.json({ status: 'UP', service: 'order-service' }));

// 1. Get basket contents and calculated summary
app.get('/basket', (req, res) => {
  let subtotal = basket.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  let deliveryFee = subtotal > 0 ? 50 : 0;
  res.json({
    items: basket,
    summary: { itemCount: basket.reduce((s, i) => s + i.quantity, 0), subtotal, deliveryFee, total: subtotal + deliveryFee }
  });
});

// 2. Add item to basket
app.post('/basket/items', (req, res) => {
  let { cakeId, name, price, quantity = 1, image } = req.body;
  let item = basket.find(i => i.cakeId === cakeId);
  item ? (item.quantity += Number(quantity)) : basket.push({ cakeId, name, price: Number(price), quantity: Number(quantity), image });
  res.status(201).json(basket);
});

// 3. Update quantity of item in basket
app.put('/basket/items/:cakeId', (req, res) => {
  let item = basket.find(i => i.cakeId === req.params.cakeId);
  if (!item) return res.status(404).json({ error: 'Item not in basket' });
  let qty = Number(req.body.quantity);
  qty <= 0 ? (basket = basket.filter(i => i.cakeId !== req.params.cakeId)) : (item.quantity = qty);
  res.json(basket);
});

// 4. Remove single item from basket
app.delete('/basket/items/:cakeId', (req, res) => {
  basket = basket.filter(i => i.cakeId !== req.params.cakeId);
  res.json(basket);
});

// 5. Clear all basket items
app.delete('/basket', (req, res) => {
  basket = [];
  res.json(basket);
});

// 6. Complete checkout, create order with status, and dispatch event
app.post('/checkout', async (req, res) => {
  if (!basket.length) return res.status(400).json({ error: 'Basket is empty' });

  let subtotal = basket.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  let order = {
    orderId: 'ORD-' + Date.now(),
    customerName: req.body.customerName || 'Rohith Kumar',
    email: req.body.email || 'customer@example.com',
    items: [...basket],
    subtotal,
    deliveryFee: 50,
    total: subtotal + 50,
    status: 'CONFIRMED',
    createdAt: new Date().toISOString()
  };

  orders.unshift(order);
  basket = [];

  // Publish order completion event asynchronously
  await publishOrderEvent({
    eventType: 'ORDER_COMPLETED',
    orderId: order.orderId,
    customerName: order.customerName,
    email: order.email,
    total: order.total,
    items: order.items.map(i => `${i.name} (x${i.quantity})`),
    timestamp: order.createdAt
  });

  res.status(201).json({ message: 'Order created', order });
});

// 7. View all orders
app.get('/orders', (req, res) => res.json(orders));

app.listen(process.env.PORT || 3002, () => {
  console.log('Order Service running on port 3002');
});
