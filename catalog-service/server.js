// Cake Catalog Service (Port 3001)
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// In-Memory Database with all required product attributes:
// name, description, category, price, availability, and image reference
let cakes = [
  {
    id: 'c1',
    name: 'Belgian Chocolate Truffle',
    category: 'Chocolate',
    price: 450,
    availability: true,
    description: 'Rich dark chocolate ganache layered with moist cocoa sponge.',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300'
  },
  {
    id: 'c2',
    name: 'Classic Red Velvet',
    category: 'Velvet',
    price: 520,
    availability: true,
    description: 'Crimson sponge topped with silky cream cheese frosting.',
    image: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=300'
  },
  {
    id: 'c3',
    name: 'Fresh Strawberry Cheesecake',
    category: 'Cheesecake',
    price: 600,
    availability: true,
    description: 'New York style cheesecake loaded with glazed fresh strawberries.',
    image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=300'
  },
  {
    id: 'c4',
    name: 'Royal Black Forest',
    category: 'Chocolate',
    price: 490,
    availability: true,
    description: 'Layered chocolate sponge, sour cherries, and fresh whipped cream.',
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=300'
  }
];

// Health check endpoint for Kubernetes probes
app.get('/health', (req, res) => res.json({ status: 'UP', service: 'catalog-service' }));

// List all cakes with optional filtering by name, category, and price range
app.get('/cakes', (req, res) => {
  let { name, category, minPrice, maxPrice } = req.query;
  let list = cakes;
  if (name) list = list.filter(c => c.name.toLowerCase().includes(name.toLowerCase()));
  if (category && category !== 'All') list = list.filter(c => c.category.toLowerCase() === category.toLowerCase());
  if (minPrice) list = list.filter(c => c.price >= Number(minPrice));
  if (maxPrice) list = list.filter(c => c.price <= Number(maxPrice));
  res.json(list);
});

// Retrieve single cake details by ID
app.get('/cakes/:id', (req, res) => {
  let cake = cakes.find(c => c.id === req.params.id);
  cake ? res.json(cake) : res.status(404).json({ error: 'Cake not found' });
});

// Return all unique categories
app.get('/categories', (req, res) => {
  res.json(['All', ...new Set(cakes.map(c => c.category))]);
});

app.listen(process.env.PORT || 3001, () => {
  console.log('Catalog Service running on port 3001');
});
