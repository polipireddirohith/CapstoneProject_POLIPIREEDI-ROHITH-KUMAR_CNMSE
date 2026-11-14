// API Gateway (Port 3000)
const express = require('express');
const cors = require('cors');
const proxy = require('express-http-proxy');
const path = require('path');
const app = express();

app.use(cors());

// Serve frontend UI
app.use(express.static(path.join(__dirname, 'public')));
app.get('/health', (req, res) => res.json({ status: 'UP' }));

// Microservice URLs
const CATALOG = process.env.CATALOG_SERVICE_URL || 'http://127.0.0.1:3001';
const ORDER = process.env.ORDER_SERVICE_URL || 'http://127.0.0.1:3002';
const RATING = process.env.RATING_SERVICE_URL || 'http://127.0.0.1:3003';
const NOTIF = process.env.NOTIFICATION_SERVICE_URL || 'http://127.0.0.1:3004';

// Forward routes to individual services
app.use('/api/catalog', proxy(CATALOG, { proxyReqPathResolver: req => req.url }));
app.use('/api/order', proxy(ORDER, { proxyReqPathResolver: req => req.url }));
app.use('/api/rating', proxy(RATING, { proxyReqPathResolver: req => req.url }));
app.use('/api/notification', proxy(NOTIF, { proxyReqPathResolver: req => req.url }));

app.listen(process.env.PORT || 3000, () => {
  console.log('API Gateway running on port 3000');
});
