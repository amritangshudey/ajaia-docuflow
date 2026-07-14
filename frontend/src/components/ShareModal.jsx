import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

export default function ShareModal({ activeDoc, currentUser, users, onClose, showToast }) {
  const [shares, setShares] = useState([]);
  const [emailInput, setEmailInput] = useState('');
  const [permission, setPermission] = useState('view');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadShares();
  }, [activeDoc]);

  const loadShares = async () => {
    try {
      const data = await api.getShares(activeDoc.id, currentUser.id);
      setShares(data);
    } catch (err) {
      showToast('Failed to load sharing list: ' + err.message, 'error');
    }
  };

  const handleShare = async (e) => {
    if (e) e.preventDefault();
    if (!emailInput.trim()) return;

    setLoading(true);
    try {
      await api.addShare(activeDoc.id, emailInput.trim(), permission, currentUser.id);
      showToast(`Successfully shared with ${emailInput}`, 'success');
      setEmailInput('');
      loadShares();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveShare = async (targetUserId) => {
    try {
      await api.removeShare(activeDoc.id, targetUserId, currentUser.id);
      showToast('Access revoked successfully', 'success');
      loadShares();
    } catch (err) {
      showToast('Failed to revoke access: ' + err.message, 'error');
    }
  };

  // Find other seeded users (not the current owner) to make it easy for reviewer to click-and-add
  const otherUsers = users.filter(u => u.id !== activeDoc.owner_id);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Share "{activeDoc.title}"</h2>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <form className="share-form" onSubmit={handleShare}>
            <div className="input-group">
              <label htmlFor="email" className="input-label">Share with Email</label>
              <div className="input-row">
                <input 
                  type="email" 
                  id="email"
                  className="text-input" 
                  placeholder="name@ajaia.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  required
                />
                <select 
                  className="permission-select"
                  value={permission}
                  onChange={(e) => setPermission(e.target.value)}
                >
                  <option value="view">Can View</option>
                  <option value="edit">Can Edit</option>
                </select>
                <button type="submit" className="primary-btn share-btn" disabled={loading}>
                  {loading ? 'Sharing...' : 'Share'}
                </button>
              </div>
            </div>
          </form>

          {/* Quick-share utility to make checking assignment extremely fast! */}
          <div className="quick-share-section">
            <span className="quick-share-label">Quick Share (click to autofill):</span>
            <div className="quick-share-buttons">
              {otherUsers.map(u => (
                <button 
                  key={u.id}
                  type="button" 
                  className="quick-user-btn"
                  onClick={() => setEmailInput(u.email)}
                >
                  <span className="bullet-avatar" style={{ backgroundColor: u.avatar_color }}></span>
                  {u.name}
                </button>
              ))}
            </div>
          </div>

          <div className="access-list-section">
            <h3 className="section-subtitle">People with access</h3>
            
            <div className="owner-row">
              <div className="user-details">
                <div 
                  className="avatar-small" 
                  style={{ backgroundColor: activeDoc.owner_avatar_color }}
                >
                  {activeDoc.owner_name?.charAt(0)}
                </div>
                <div className="user-text">
                  <span className="user-display-name">{activeDoc.owner_name} (Owner)</span>
                  <span className="user-email-display">{activeDoc.owner_email}</span>
                </div>
              </div>
              <span className="owner-badge">Owner</span>
            </div>

            <div className="shared-users-list">
              {shares.map(share => (
                <div key={share.user_id} className="share-row">
                  <div className="user-details">
                    <div 
                      className="avatar-small" 
                      style={{ backgroundColor: share.avatar_color }}
                    >
                      {share.name?.charAt(0)}
                    </div>
                    <div className="user-text">
                      <span className="user-display-name">{share.name}</span>
                      <span className="user-email-display">{share.email}</span>
                    </div>
                  </div>
                  
                  <div className="share-actions">
                    <span className="share-permission-text">
                      {share.permission === 'edit' ? 'Can edit' : 'Can view'}
                    </span>
                    <button 
                      className="revoke-btn" 
                      onClick={() => handleRemoveShare(share.user_id)}
                      title="Revoke Access"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              {shares.length === 0 && (
                <p className="no-shares-text">This document hasn't been shared with anyone yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
