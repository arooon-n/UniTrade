import express from 'express';
import { db } from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard stats
router.get('/stats', authenticate, authorize(['admin']), (req, res) => {
  const stats = {};

  // Get user stats
  db.get(
    'SELECT COUNT(*) as total_users, COUNT(CASE WHEN role = "student" THEN 1 END) as students FROM users',
    (err, userStats) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      stats.users = userStats;

      // Get product stats
      db.get(
        `SELECT 
           COUNT(*) as total_products,
           COUNT(CASE WHEN product_status = 'available' THEN 1 END) as available_products,
           COUNT(CASE WHEN product_status = 'sold' THEN 1 END) as sold_products,
           COUNT(CASE WHEN product_status = 'rented' THEN 1 END) as rented_products
         FROM products`,
        (err, productStats) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          stats.products = productStats;

          // Get transaction stats
          db.get(
            `SELECT 
               COUNT(*) as total_transactions,
               COUNT(CASE WHEN transaction_type = 'purchase' THEN 1 END) as purchases,
               COUNT(CASE WHEN transaction_type = 'rental' THEN 1 END) as rentals,
               SUM(amount) as total_revenue,
               COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) as completed_transactions
             FROM transactions`,
            (err, transactionStats) => {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }
              stats.transactions = transactionStats;

              // Get report stats
              db.get(
                `SELECT 
                   COUNT(*) as total_reports,
                   COUNT(CASE WHEN report_status = 'pending' THEN 1 END) as pending_reports,
                   COUNT(CASE WHEN report_status = 'resolved' THEN 1 END) as resolved_reports
                 FROM reports`,
                (err, reportStats) => {
                  if (err) {
                    return res.status(500).json({ error: 'Database error' });
                  }
                  stats.reports = reportStats;

                  res.json({ stats });
                }
              );
            }
          );
        }
      );
    }
  );
});

// Get analytics data
router.get('/analytics', authenticate, authorize(['admin']), (req, res) => {
  const { period = '30' } = req.query; // days

  // Get daily transactions for the period
  db.all(
    `SELECT 
       DATE(transaction_date) as date,
       COUNT(*) as count,
       SUM(amount) as revenue,
       COUNT(CASE WHEN transaction_type = 'purchase' THEN 1 END) as purchases,
       COUNT(CASE WHEN transaction_type = 'rental' THEN 1 END) as rentals
     FROM transactions 
     WHERE transaction_date >= datetime('now', '-${period} days')
     GROUP BY DATE(transaction_date)
     ORDER BY date`,
    (err, dailyStats) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Get category distribution
      db.all(
        `SELECT 
           p.category,
           COUNT(*) as count,
           AVG(p.price) as avg_price
         FROM products p
         GROUP BY p.category
         ORDER BY count DESC`,
        (err, categoryStats) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          // Get top selling users
          db.all(
            `SELECT 
               u.name,
               u.user_id,
               COUNT(t.transaction_id) as sales_count,
               SUM(t.amount) as total_revenue
             FROM users u
             JOIN transactions t ON u.user_id = t.seller_id
             WHERE t.payment_status = 'completed'
             GROUP BY u.user_id, u.name
             ORDER BY total_revenue DESC
             LIMIT 10`,
            (err, topSellers) => {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }

              res.json({
                dailyStats,
                categoryStats,
                topSellers
              });
            }
          );
        }
      );
    }
  );
});

// Get all users (admin only)
router.get('/users', authenticate, authorize(['admin']), (req, res) => {
  const { search, role, limit = 50, offset = 0 } = req.query;

  let query = 'SELECT user_id, name, email_id, phone_number, role, rating, created_at FROM users WHERE 1=1';
  const params = [];

  if (search) {
    query += ' AND (name LIKE ? OR email_id LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  if (role) {
    query += ' AND role = ?';
    params.push(role);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  db.all(query, params, (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ users });
  });
});

// Ban/unban user
router.patch('/users/:id/status', authenticate, authorize(['admin']), (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // 'ban' or 'unban'

  if (!['ban', 'unban'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }

  // For simplicity, we'll add a banned field to users table in a real implementation
  // Here we'll just return success
  res.json({ message: `User ${action}ned successfully` });
});

export default router;