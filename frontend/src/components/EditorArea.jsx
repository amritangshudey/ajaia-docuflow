import React, { useEffect, useRef, useState } from 'react';
import Quill from 'quill';
import ShareModal from './ShareModal';
import { api } from '../utils/api';

export default function EditorArea({ 
  activeDoc, 
  currentUser, 
  users, 
  onBackToDashboard, 
  onUpdateDocList,
  showToast 
}) {
  const editorContainerRef = useRef(null);
  const quillRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  const [title, setTitle] = useState(activeDoc.title);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving', 'error', 'viewonly'
  const [showShareModal, setShowShareModal] = useState(false);

  const permission = activeDoc.permission;
  const isOwner = permission === 'owner';
  const isEditable = permission === 'owner' || permission === 'edit';

  // Synchronize state when switching documents
  useEffect(() => {
    setTitle(activeDoc.title);
    if (permission === 'view') {
      setSaveStatus('viewonly');
    } else {
      setSaveStatus('saved');
    }
  }, [activeDoc.id, permission]);

  // Initialize Quill Editor
  useEffect(() => {
    if (!editorContainerRef.current) return;

    // Clear element to avoid duplicating toolbar on re-renders
    editorContainerRef.current.innerHTML = '<div class="editor-inner-box"></div>';
    const innerBox = editorContainerRef.current.querySelector('.editor-inner-box');

    const quill = new Quill(innerBox, {
      theme: 'snow',
      modules: {
        toolbar: isEditable ? [
          [{ 'header': [1, 2, 3, false] }],
          ['bold', 'italic', 'underline'],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          ['clean']
        ] : false
      },
      placeholder: isEditable ? 'Start typing your document...' : 'This document is view-only.',
      readOnly: !isEditable
    });

    quillRef.current = quill;

    // Load initial content
    if (activeDoc.content) {
      quill.clipboard.dangerouslyPasteHTML(activeDoc.content);
    }

    // Text Change Listener (Auto-Save trigger)
    quill.on('text-change', () => {
      if (!isEditable) return;
      
      setSaveStatus('saving');
      
      // Debounce saving
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        triggerSave(title, quill.root.innerHTML);
      }, 1000);
    });

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [activeDoc.id, isEditable]);

  // Handle Title input changes
  const handleTitleChange = (e) => {
    if (!isEditable) return;
    const newTitle = e.target.value;
    setTitle(newTitle);
    setSaveStatus('saving');

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      const currentContent = quillRef.current ? quillRef.current.root.innerHTML : activeDoc.content;
      triggerSave(newTitle, currentContent);
    }, 1000);
  };

  // Perform backend PUT save
  const triggerSave = async (updatedTitle, updatedContent) => {
    try {
      await api.updateDocument(activeDoc.id, updatedTitle, updatedContent, currentUser.id);
      setSaveStatus('saved');
      onUpdateDocList(activeDoc.id, updatedTitle, updatedContent);
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
      showToast('Error autosaving changes: ' + err.message, 'error');
    }
  };

  // Immediate save on leaving or manually hitting shortcut
  const handleManualSave = () => {
    if (!isEditable) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    const currentContent = quillRef.current ? quillRef.current.root.innerHTML : activeDoc.content;
    triggerSave(title, currentContent);
    showToast('Document saved successfully.', 'success');
  };

  // Export to markdown
  const exportToMarkdown = () => {
    const rawContent = quillRef.current ? quillRef.current.getText() : activeDoc.content;
    const markdownContent = `# ${title}\n\n${rawContent}`;
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${title.replace(/\s+/g, '_')}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported to Markdown successfully.', 'success');
  };

  // Export to text
  const exportToText = () => {
    const rawContent = quillRef.current ? quillRef.current.getText() : activeDoc.content;
    const blob = new Blob([rawContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${title.replace(/\s+/g, '_')}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported to Plain Text successfully.', 'success');
  };

  return (
    <div className="editor-area-container">
      {/* Editor Sub-Header / Controls */}
      <div className="editor-control-panel">
        <div className="control-left">
          <input 
            type="text" 
            className="document-title-input" 
            value={title} 
            onChange={handleTitleChange}
            disabled={!isEditable}
            placeholder="Untitled Document"
          />
          <div className="save-indicator">
            {saveStatus === 'saved' && (
              <span className="status-badge status-saved">
                <span className="dot"></span> Saved to cloud
              </span>
            )}
            {saveStatus === 'saving' && (
              <span className="status-badge status-saving">
                <span className="dot animate-ping"></span> Saving...
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="status-badge status-error">
                ⚠️ Save failed
              </span>
            )}
            {saveStatus === 'viewonly' && (
              <span className="status-badge status-viewonly">
                🔒 Read-only
              </span>
            )}
          </div>
        </div>

        <div className="control-right">
          {/* Document metadata display */}
          <div className="sharing-status-info">
            <span className="owner-label">Owner:</span>
            <div 
              className="avatar-mini" 
              style={{ backgroundColor: activeDoc.owner_avatar_color }}
              title={activeDoc.owner_name}
            >
              {activeDoc.owner_name?.charAt(0)}
            </div>
            <span className="owner-name-mini">{activeDoc.owner_id === currentUser.id ? 'You' : activeDoc.owner_name}</span>
          </div>

          <div className="export-menu">
            <button className="secondary-btn btn-sm" onClick={exportToText} title="Download as .txt">
              TXT
            </button>
            <button className="secondary-btn btn-sm" onClick={exportToMarkdown} title="Download as .md">
              MD
            </button>
          </div>

          {isOwner ? (
            <button className="primary-btn btn-sm share-trigger-btn" onClick={() => setShowShareModal(true)}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Share
            </button>
          ) : (
            <span className="read-write-badge">
              {permission === 'edit' ? '✏️ Can Edit' : '👁️ View Only'}
            </span>
          )}
        </div>
      </div>

      {/* Actual Editor container for Quill */}
      <div className="quill-editor-wrapper" ref={editorContainerRef}>
        {/* Managed by Quill */}
      </div>

      {showShareModal && (
        <ShareModal 
          activeDoc={activeDoc} 
          currentUser={currentUser} 
          users={users} 
          onClose={() => setShowShareModal(false)}
          showToast={showToast}
        />
      )}
    </div>
  );
}
