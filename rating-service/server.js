// Rating Service (Port 3003)
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

let ratings = [
  { cakeId: 'c1', customerName: 'Aarav', rating: 5, comment: 'Great taste!' },
  { cakeId: 'c1', customerName: 'Sneha', rating: 4, comment: 'Very soft' }
];

// Health check endpoint
app.get('/health', (req, res) => res.json({ status: 'UP' }));

// Submit a review for a cake
app.post('/ratings', (req, res) => {
  let { cakeId, rating, customerName = 'Guest', comment = '' } = req.body;
  let newRating = { cakeId, customerName, rating: Number(rating), comment };
  ratings.unshift(newRating);
  res.status(201).json({ message: 'Rating saved', rating: newRating });
});

// Get reviews and calculate average score for a cake
app.get('/ratings/:cakeId', (req, res) => {
  let list = ratings.filter(r => r.cakeId === req.params.cakeId);
  let total = list.length;
  let avg = total > 0 ? (list.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1) : 0;
  res.json({ cakeId: req.params.cakeId, averageRating: Number(avg), totalReviews: total, reviews: list });
});

app.listen(process.env.PORT || 3003, () => {
  console.log('Rating Service running on port 3003');
});
