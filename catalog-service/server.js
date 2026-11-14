// Cake Catalog Service (Port 3001)
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// In-memory cake items
let cakes = [
  { id: 'c1', name: 'Chocolate Truffle', category: 'Chocolate', price: 450 },
  { id: 'c2', name: 'Red Velvet', category: 'Velvet', price: 520 },
  { id: 'c3', name: 'Strawberry Cheesecake', category: 'Cheesecake', price: 600 },
  { id: 'c4', name: 'Black Forest', category: 'Chocolate', price: 490 }
];

// Health check endpoint
app.get('/health', (req, res) => res.json({ status: 'UP' }));

// List all cakes or filter by name, category, and price range
app.get('/cakes', (req, res) => {
  let { name, category, minPrice, maxPrice } = req.query;
  let list = cakes;
  if (name) list = list.filter(c => c.name.toLowerCase().includes(name.toLowerCase()));
  if (category && category !== 'All') list = list.filter(c => c.category.toLowerCase() === category.toLowerCase());
  if (minPrice) list = list.filter(c => c.price >= Number(minPrice));
  if (maxPrice) list = list.filter(c => c.price <= Number(maxPrice));
  res.json(list);
});

// Get single cake by id
app.get('/cakes/:id', (req, res) => {
  let cake = cakes.find(c => c.id === req.params.id);
  res.json(cake || { error: 'Not found' });
});

// Get all unique categories
app.get('/categories', (req, res) => {
  res.json(['All', ...new Set(cakes.map(c => c.category))]);
});

app.listen(process.env.PORT || 3001, () => {
  console.log('Catalog Service running on port 3001');
});
