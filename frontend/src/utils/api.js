const API_BASE = '/api';

async function request(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
}

export const api = {
  // Users
  getUsers: () => request('/users'),

  // Documents
  getDocuments: (userId) => request(`/documents?userId=${userId}`),
  
  getDocument: (id, userId) => request(`/documents/${id}?userId=${userId}`),
  
  createDocument: (title, content, ownerId) => 
    request('/documents', {
      method: 'POST',
      body: JSON.stringify({ title, content, ownerId }),
    }),

  updateDocument: (id, title, content, userId) =>
    request(`/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ title, content, userId }),
    }),

  deleteDocument: (id, userId) =>
    request(`/documents/${id}?userId=${userId}`, {
      method: 'DELETE',
    }),

  // Sharing
  getShares: (id, userId) => request(`/documents/${id}/shares?userId=${userId}`),

  addShare: (id, email, permission, userId) =>
    request(`/documents/${id}/shares`, {
      method: 'POST',
      body: JSON.stringify({ email, permission, userId }),
    }),

  removeShare: (id, targetUserId, userId) =>
    request(`/documents/${id}/shares/${targetUserId}?userId=${userId}`, {
      method: 'DELETE',
    }),
};
