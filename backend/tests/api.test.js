import request from 'supertest';
import app from '../server.js';
import db, { initDb } from '../db.js';

describe('Ajaia DocuFlow Backend API Tests', () => {
  beforeAll(async () => {
    // Set NODE_ENV to test to trigger in-memory DB in db.js
    process.env.NODE_ENV = 'test';
    await initDb();
  });

  afterAll((done) => {
    db.close((err) => {
      if (err) console.error(err);
      done();
    });
  });

  let testDocId = null;

  test('GET /api/users returns seeded users', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(3);
    expect(res.body.map((u) => u.id)).toContain('user-alice');
  });

  test('POST /api/documents creates a new document for Alice', async () => {
    const res = await request(app)
      .post('/api/documents')
      .send({
        title: 'Project Proposal',
        content: 'Initial contents of the project.',
        ownerId: 'user-alice'
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.title).toBe('Project Proposal');
    expect(res.body.owner_id).toBe('user-alice');

    testDocId = res.body.id;
  });

  test('GET /api/documents/:id returns 403 Forbidden for unauthorized user Bob', async () => {
    const res = await request(app)
      .get(`/api/documents/${testDocId}`)
      .query({ userId: 'user-bob' });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Permission denied');
  });

  test('POST /api/documents/:id/shares shares the document with Bob with view permission', async () => {
    const res = await request(app)
      .post(`/api/documents/${testDocId}/shares`)
      .send({
        email: 'bob@ajaia.com',
        permission: 'view',
        userId: 'user-alice' // Owner performing action
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('GET /api/documents/:id now returns document details for Bob', async () => {
    const res = await request(app)
      .get(`/api/documents/${testDocId}`)
      .query({ userId: 'user-bob' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Project Proposal');
    expect(res.body.permission).toBe('view');
  });

  test('PUT /api/documents/:id fails with 403 for Bob (view-only)', async () => {
    const res = await request(app)
      .put(`/api/documents/${testDocId}`)
      .send({
        content: 'Bob tries to modify text.',
        userId: 'user-bob'
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Document is read-only for this user');
  });

  test('POST /api/documents/:id/shares upgrades Bob to edit permission', async () => {
    const res = await request(app)
      .post(`/api/documents/${testDocId}/shares`)
      .send({
        email: 'bob@ajaia.com',
        permission: 'edit',
        userId: 'user-alice'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('PUT /api/documents/:id succeeds for Bob now that he is an editor', async () => {
    const res = await request(app)
      .put(`/api/documents/${testDocId}`)
      .send({
        content: 'Bob updated contents successfully.',
        userId: 'user-bob'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
