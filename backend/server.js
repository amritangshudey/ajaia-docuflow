import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { run, get, all, initDb } from './db.js';

const app = express();
const port = process.env.PORT || 5001;
let dbReady = false;

app.use(cors());
app.use(express.json());

// Enable Foreign Key support in SQLite (but skip if not ready)
app.use(async (req, res, next) => {
  try {
    if (dbReady) {
      await run('PRAGMA foreign_keys = ON;');
    }
    next();
  } catch (err) {
    // Log but don't fail the entire request
    console.error('PRAGMA error:', err);
    next();
  }
});

// Init DB and seed (disabled in test env, as tests trigger it explicitly)
if (process.env.NODE_ENV !== 'test') {
  console.log('Starting database initialization...');
  initDb()
    .then(() => {
      dbReady = true;
      console.log('✓ Database initialized successfully.');
    })
    .catch((err) => {
      console.error('✗ Database initialization failed:', err.message || err);
      // Still mark as ready so the app continues to work
      dbReady = true;
    });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', dbReady });
});

// HELPER: Validate document access for a user
async function getDocAccess(documentId, userId) {
  if (!userId) return null;

  // Check if document exists and get its owner
  const doc = await get('SELECT * FROM documents WHERE id = ?', [documentId]);
  if (!doc) return null;

  if (doc.owner_id === userId) {
    return { doc, permission: 'owner' };
  }

  // Check shares table
  const share = await get(
    'SELECT permission FROM shares WHERE document_id = ? AND user_id = ?',
    [documentId, userId]
  );
  if (share) {
    return { doc, permission: share.permission };
  }

  return null; // No access
}

// 1. Get all users (for switching and sharing)
app.get('/api/users', async (req, res) => {
  try {
    const users = await all('SELECT id, name, email, avatar_color FROM users');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get all documents for a user (both owned and shared)
app.get('/api/documents', async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    const sql = `
      SELECT 
        d.id, 
        d.title, 
        d.content,
        d.owner_id, 
        u_owner.name AS owner_name, 
        u_owner.avatar_color AS owner_avatar_color, 
        d.created_at, 
        d.updated_at,
        'owner' AS permission
      FROM documents d
      JOIN users u_owner ON d.owner_id = u_owner.id
      WHERE d.owner_id = ?
      
      UNION ALL
      
      SELECT 
        d.id, 
        d.title, 
        d.content,
        d.owner_id, 
        u_owner.name AS owner_name, 
        u_owner.avatar_color AS owner_avatar_color, 
        d.created_at, 
        d.updated_at,
        s.permission AS permission
      FROM documents d
      JOIN users u_owner ON d.owner_id = u_owner.id
      JOIN shares s ON d.id = s.document_id
      WHERE s.user_id = ?
      ORDER BY updated_at DESC
    `;

    const docs = await all(sql, [userId, userId]);
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Create document
app.post('/api/documents', async (req, res) => {
  const { title, content, ownerId } = req.body;
  if (!ownerId) {
    return res.status(400).json({ error: 'ownerId is required' });
  }

  const docTitle = title || 'Untitled Document';
  const docContent = content || '';
  const docId = crypto.randomUUID();

  try {
    // Verify owner exists
    const owner = await get('SELECT id FROM users WHERE id = ?', [ownerId]);
    if (!owner) {
      return res.status(404).json({ error: 'Owner user not found' });
    }

    await run(
      'INSERT INTO documents (id, title, content, owner_id) VALUES (?, ?, ?, ?)',
      [docId, docTitle, docContent, ownerId]
    );

    const newDoc = await get(
      `SELECT d.*, u.name as owner_name, u.avatar_color as owner_avatar_color 
       FROM documents d JOIN users u ON d.owner_id = u.id WHERE d.id = ?`,
      [docId]
    );
    res.status(201).json({ ...newDoc, permission: 'owner' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Get individual document
app.get('/api/documents/:id', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;

  try {
    const access = await getDocAccess(id, userId);
    if (!access) {
      // Check if document exists at all
      const docExists = await get('SELECT id FROM documents WHERE id = ?', [id]);
      if (!docExists) {
        return res.status(404).json({ error: 'Document not found' });
      }
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Fetch full owner info
    const owner = await get('SELECT name, email, avatar_color FROM users WHERE id = ?', [access.doc.owner_id]);

    res.json({
      ...access.doc,
      permission: access.permission,
      owner_name: owner.name,
      owner_email: owner.email,
      owner_avatar_color: owner.avatar_color
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Update document (title and/or content)
app.put('/api/documents/:id', async (req, res) => {
  const { id } = req.params;
  const { title, content, userId } = req.body;

  try {
    const access = await getDocAccess(id, userId);
    if (!access) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    if (access.permission === 'view') {
      return res.status(403).json({ error: 'Document is read-only for this user' });
    }

    const updatedTitle = title !== undefined ? title : access.doc.title;
    const updatedContent = content !== undefined ? content : access.doc.content;

    await run(
      'UPDATE documents SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [updatedTitle, updatedContent, id]
    );

    res.json({ success: true, message: 'Document updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Delete document
app.delete('/api/documents/:id', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;

  try {
    const access = await getDocAccess(id, userId);
    if (!access) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    if (access.permission !== 'owner') {
      return res.status(403).json({ error: 'Only the owner can delete this document' });
    }

    await run('DELETE FROM documents WHERE id = ?', [id]);
    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Get all shares for a document
app.get('/api/documents/:id/shares', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;

  try {
    const access = await getDocAccess(id, userId);
    if (!access) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const shares = await all(
      `SELECT s.user_id, s.permission, u.name, u.email, u.avatar_color
       FROM shares s
       JOIN users u ON s.user_id = u.id
       WHERE s.document_id = ?`,
      [id]
    );
    res.json(shares);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Add share / Update share
app.post('/api/documents/:id/shares', async (req, res) => {
  const { id } = req.params;
  const { email, permission, userId } = req.body; // userId is the action performer (owner)

  if (!email || !permission) {
    return res.status(400).json({ error: 'email and permission are required' });
  }

  try {
    const access = await getDocAccess(id, userId);
    if (!access || access.permission !== 'owner') {
      return res.status(403).json({ error: 'Only the owner can share this document' });
    }

    // Find the target user by email
    const targetUser = await get('SELECT id, name FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (!targetUser) {
      return res.status(404).json({ error: 'No user found with that email' });
    }

    if (targetUser.id === access.doc.owner_id) {
      return res.status(400).json({ error: 'Cannot share a document with its owner' });
    }

    // Insert or replace share
    await run(
      `INSERT INTO shares (document_id, user_id, permission) 
       VALUES (?, ?, ?)
       ON CONFLICT(document_id, user_id) DO UPDATE SET permission = excluded.permission`,
      [id, targetUser.id, permission]
    );

    res.json({ success: true, message: `Document shared with ${targetUser.name}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Remove share
app.delete('/api/documents/:id/shares/:targetUserId', async (req, res) => {
  const { id, targetUserId } = req.params;
  const { userId } = req.query; // userId is the action performer (owner)

  try {
    const access = await getDocAccess(id, userId);
    if (!access || access.permission !== 'owner') {
      return res.status(403).json({ error: 'Only the owner can manage sharing' });
    }

    await run('DELETE FROM shares WHERE document_id = ? AND user_id = ?', [id, targetUserId]);
    res.json({ success: true, message: 'Share access revoked successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

export default app;
