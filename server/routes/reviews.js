import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest, schemas } from '../middleware/validation.js';

const router = express.Router();

// Create review
router.post('/:productId', authenticate, validateRequest(schemas.review), (req, res) => {
  const { productId } = req.params;
  const { rating, comment } = req.body;
  const reviewer_id = req.user.userId;

  // Check if user has purchased/rented this product
  db.get(
    'SELECT * FROM transactions WHERE product_id = ? AND buyer_id = ? AND payment_status = "completed"',
    [productId, reviewer_id],
    (err, transaction) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!transaction) {
        return res.status(400).json({ error: 'You can only review products you have purchased or rented' });
      }

      // Check if review already exists
      db.get(
        'SELECT * FROM reviews WHERE product_id = ? AND reviewer_id = ?',
        [productId, reviewer_id],
        (err, existingReview) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          if (existingReview) {
            return res.status(400).json({ error: 'You have already reviewed this product' });
          }

          // Create review
          const review_id = uuidv4();
          db.run(
            'INSERT INTO reviews (review_id, product_id, reviewer_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
            [review_id, productId, reviewer_id, rating, comment],
            function(err) {
              if (err) {
                return res.status(500).json({ error: 'Failed to create review' });
              }

              // Update user rating
              updateUserRating(productId);

              res.status(201).json({
                message: 'Review created successfully',
                review_id
              });
            }
          );
        }
      );
    }
  );
});

// Get reviews for a product
router.get('/product/:productId', (req, res) => {
  const { productId } = req.params;

  db.all(
    `SELECT r.*, u.name as reviewer_name
     FROM reviews r
     JOIN users u ON r.reviewer_id = u.user_id
     WHERE r.product_id = ?
     ORDER BY r.created_at DESC`,
    [productId],
    (err, reviews) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ reviews });
    }
  );
});

// Update review
router.put('/:id', authenticate, validateRequest(schemas.review), (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;
  const reviewer_id = req.user.userId;

  // Check if review belongs to user
  db.get('SELECT * FROM reviews WHERE review_id = ? AND reviewer_id = ?', [id, reviewer_id], (err, review) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!review) {
      return res.status(404).json({ error: 'Review not found or access denied' });
    }

    // Update review
    db.run(
      'UPDATE reviews SET rating = ?, comment = ? WHERE review_id = ?',
      [rating, comment, id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to update review' });
        }

        // Update user rating
        updateUserRating(review.product_id);

        res.json({ message: 'Review updated successfully' });
      }
    );
  });
});

// Delete review
router.delete('/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const reviewer_id = req.user.userId;

  // Check if review belongs to user or user is admin
  db.get('SELECT * FROM reviews WHERE review_id = ?', [id], (err, review) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (review.reviewer_id !== reviewer_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete review
    db.run('DELETE FROM reviews WHERE review_id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete review' });
      }

      // Update user rating
      updateUserRating(review.product_id);

      res.json({ message: 'Review deleted successfully' });
    });
  });
});

// Helper function to update user rating
function updateUserRating(productId) {
  // Get product owner
  db.get('SELECT owner_id FROM products WHERE product_id = ?', [productId], (err, product) => {
    if (!err && product) {
      // Calculate average rating for user's products
      db.get(
        `SELECT AVG(r.rating) as avg_rating
         FROM reviews r
         JOIN products p ON r.product_id = p.product_id
         WHERE p.owner_id = ?`,
        [product.owner_id],
        (err, result) => {
          if (!err && result.avg_rating) {
            db.run(
              'UPDATE users SET rating = ? WHERE user_id = ?',
              [Math.round(result.avg_rating * 10) / 10, product.owner_id]
            );
          }
        }
      );
    }
  });
}

export default router;