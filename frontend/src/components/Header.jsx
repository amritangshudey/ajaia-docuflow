import React from 'react';

export default function Header({ users, currentUser, onSelectUser, activeDoc, onBackToDashboard }) {
  return (
    <header className="app-header">
      <div className="header-left" onClick={onBackToDashboard}>
        <div className="app-logo">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="url(#logoGrad)" />
            <path d="M10 9H22V11H10V9ZM10 14H22V16H10V14ZM10 19H17V21H10V19Z" fill="white" />
            <defs>
              <linearGradient id="logoGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366F1" />
                <stop offset="1" stopColor="#D946EF" />
              </linearGradient>
            </defs>
          </svg>
          <span className="brand-name">Ajaia <span className="gradient-text">DocuFlow</span></span>
        </div>
      </div>

      <nav className="header-nav">
        {activeDoc && (
          <button className="nav-back-btn" onClick={onBackToDashboard}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
        )}
      </nav>

      <div className="header-right">
        <div className="user-simulator">
          <span className="simulator-label">Simulating User:</span>
          <select 
            className="user-select"
            value={currentUser?.id || ''} 
            onChange={(e) => onSelectUser(e.target.value)}
          >
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email.split('@')[0]})
              </option>
            ))}
          </select>
        </div>

        {currentUser && (
          <div className="current-user-badge">
            <div 
              className="user-avatar" 
              style={{ backgroundColor: currentUser.avatar_color }}
            >
              {currentUser.name.charAt(0)}
            </div>
            <span className="user-name">{currentUser.name}</span>
          </div>
        )}
      </div>
    </header>
  );
}
