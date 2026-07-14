import React, { useState } from 'react';

export default function Dashboard({ documents, currentUser, onCreateDoc, onDeleteDoc, onSelectDoc, showToast }) {
  const [filter, setFilter] = useState('all'); // all, owned, shared
  const [dragOver, setDragOver] = useState(false);

  const filteredDocs = documents.filter((doc) => {
    if (filter === 'owned') return doc.owner_id === currentUser.id;
    if (filter === 'shared') return doc.owner_id !== currentUser.id;
    return true;
  });

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await processImportFile(file);
    e.target.value = ''; // reset file input
  };

  const processImportFile = async (file) => {
    const filename = file.name;
    const ext = filename.split('.').pop().toLowerCase();

    if (ext !== 'txt' && ext !== 'md') {
      showToast('Only .txt and .md files are supported for import.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target.result;
      const title = filename.substring(0, filename.lastIndexOf('.')) || 'Imported Document';
      try {
        const newDoc = await onCreateDoc(title, content);
        showToast(`Successfully imported "${title}"`, 'success');
        onSelectDoc(newDoc);
      } catch (err) {
        showToast(`Failed to import file: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
  };

  // Drag and Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      await processImportFile(file);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-hero">
        <h1 className="hero-title">Collaborate, create, and share.</h1>
        <p className="hero-subtitle">Premium web document experience powered by modern AI aesthetics.</p>

        <div className="action-row">
          <button className="primary-btn btn-lg" onClick={() => onCreateDoc('Untitled Document', '')}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            Create New Document
          </button>

          <label className="secondary-btn btn-lg file-upload-label">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import File (.txt, .md)
            <input 
              type="file" 
              accept=".txt,.md" 
              className="hidden-file-input" 
              onChange={handleFileChange}
            />
          </label>
        </div>
      </div>

      <div 
        className={`drag-drop-zone ${dragOver ? 'active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <span className="drag-drop-text">
          {dragOver ? 'Drop file here to upload!' : '💡 Tip: Drag and drop a .txt or .md file anywhere here to instantly import as a document.'}
        </span>
      </div>

      <div className="dashboard-content">
        <div className="content-header">
          <h2 className="section-title">Documents</h2>
          <div className="filter-tabs">
            <button 
              className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button 
              className={`filter-tab ${filter === 'owned' ? 'active' : ''}`}
              onClick={() => setFilter('owned')}
            >
              Owned by Me
            </button>
            <button 
              className={`filter-tab ${filter === 'shared' ? 'active' : ''}`}
              onClick={() => setFilter('shared')}
            >
              Shared with Me
            </button>
          </div>
        </div>

        {filteredDocs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📂</div>
            <h3>No documents found</h3>
            <p>Create a new document or import a file to get started.</p>
          </div>
        ) : (
          <div className="document-grid">
            {filteredDocs.map((doc) => {
              const isOwner = doc.owner_id === currentUser.id;
              return (
                <div key={doc.id} className="document-card" onClick={() => onSelectDoc(doc)}>
                  <div className="card-header">
                    <h3 className="document-card-title">{doc.title}</h3>
                    <div className="badge-container">
                      {isOwner ? (
                        <span className="badge badge-owner">Owner</span>
                      ) : (
                        <span className={`badge ${doc.permission === 'edit' ? 'badge-editor' : 'badge-viewer'}`}>
                          {doc.permission === 'edit' ? 'Can Edit' : 'Can View'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="card-meta">
                    <div className="owner-info">
                      <div 
                        className="avatar-small" 
                        style={{ backgroundColor: doc.owner_avatar_color }}
                        title={`Owner: ${doc.owner_name}`}
                      >
                        {doc.owner_name?.charAt(0)}
                      </div>
                      <span className="owner-name-small">{isOwner ? 'You' : doc.owner_name}</span>
                    </div>
                    <span className="time-meta">Updated {formatDate(doc.updated_at)}</span>
                  </div>

                  <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                    {isOwner ? (
                      <button 
                        className="delete-card-btn" 
                        onClick={() => onDeleteDoc(doc.id)}
                        title="Delete Document"
                      >
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    ) : (
                      <span className="shared-indicator-text">Shared</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
