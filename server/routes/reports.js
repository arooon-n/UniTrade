import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequest, schemas } from '../middleware/validation.js';

const router = express.Router();

// Create report
router.post('/', authenticate, validateRequest(schemas.report), (req, res) => {
  const { accused_id, product_id, review_id, complaint } = req.body;
  const writer_id = req.user.userId;

  if (!accused_id && !product_id && !review_id) {
    return res.status(400).json({ error: 'Must specify at least one: accused_id, product_id, or review_id' });
  }

  const report_id = uuidv4();

  db.run(
    'INSERT INTO reports (report_id, writer_id, accused_id, product_id, review_id, complaint) VALUES (?, ?, ?, ?, ?, ?)',
    [report_id, writer_id, accused_id, product_id, review_id, complaint],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create report' });
      }

      res.status(201).json({
        message: 'Report submitted successfully',
        report_id
      });
    }
  );
});

// Get all reports (admin only)
router.get('/', authenticate, authorize(['admin']), (req, res) => {
  const { status } = req.query;

  let query = `
    SELECT r.*, 
           writer.name as writer_name,
           accused.name as accused_name,
           p.title as product_title,
           rev.comment as review_comment
    FROM reports r
    LEFT JOIN users writer ON r.writer_id = writer.user_id
    LEFT JOIN users accused ON r.accused_id = accused.user_id
    LEFT JOIN products p ON r.product_id = p.product_id
    LEFT JOIN reviews rev ON r.review_id = rev.review_id
    WHERE 1=1
  `;

  const params = [];

  if (status) {
    query += ' AND r.report_status = ?';
    params.push(status);
  }

  query += ' ORDER BY r.created_at DESC';

  db.all(query, params, (err, reports) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ reports });
  });
});

// Get user's reports
router.get('/user', authenticate, (req, res) => {
  const writer_id = req.user.userId;

  db.all(
    `SELECT r.*, 
           accused.name as accused_name,
           p.title as product_title,
           rev.comment as review_comment
     FROM reports r
     LEFT JOIN users accused ON r.accused_id = accused.user_id
     LEFT JOIN products p ON r.product_id = p.product_id
     LEFT JOIN reviews rev ON r.review_id = rev.review_id
     WHERE r.writer_id = ?
     ORDER BY r.created_at DESC`,
    [writer_id],
    (err, reports) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ reports });
    }
  );
});

// Update report status (admin only)
router.patch('/:id', authenticate, authorize(['admin']), (req, res) => {
  const { id } = req.params;
  const { report_status } = req.body;
  const resolved_by = req.user.userId;

  if (!['pending', 'resolved', 'dismissed'].includes(report_status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const resolved_at = report_status !== 'pending' ? new Date().toISOString() : null;

  db.run(
    'UPDATE reports SET report_status = ?, resolved_at = ?, resolved_by = ? WHERE report_id = ?',
    [report_status, resolved_at, resolved_by, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update report' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Report not found' });
      }

      res.json({ message: 'Report status updated successfully' });
    }
  );
});

// Get report by ID
router.get('/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  let query = `
    SELECT r.*, 
           writer.name as writer_name,
           accused.name as accused_name,
           p.title as product_title, p.description as product_description,
           rev.comment as review_comment, rev.rating as review_rating,
           resolver.name as resolver_name
    FROM reports r
    LEFT JOIN users writer ON r.writer_id = writer.user_id
    LEFT JOIN users accused ON r.accused_id = accused.user_id
    LEFT JOIN products p ON r.product_id = p.product_id
    LEFT JOIN reviews rev ON r.review_id = rev.review_id
    LEFT JOIN users resolver ON r.resolved_by = resolver.user_id
    WHERE r.report_id = ?
  `;

  const params = [id];

  // Only allow admin or report writer to view
  if (req.user.role !== 'admin') {
    query += ' AND r.writer_id = ?';
    params.push(userId);
  }

  db.get(query, params, (err, report) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!report) {
      return res.status(404).json({ error: 'Report not found or access denied' });
    }

    res.json({ report });
  });
});

export default router;