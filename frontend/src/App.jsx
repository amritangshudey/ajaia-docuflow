import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import EditorArea from './components/EditorArea';
import Toast from './components/Toast';
import { api } from './utils/api';

export default function App() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [activeDoc, setActiveDoc] = useState(null);
  const [toast, setToast] = useState({ message: '', type: '' });

  // Initial Load: Fetch users
  useEffect(() => {
    async function loadUsers() {
      try {
        const usersList = await api.getUsers();
        setUsers(usersList);
        if (usersList.length > 0) {
          // Default to Alice
          setCurrentUser(usersList[0]);
        }
      } catch (err) {
        showToast('Failed to load simulated users: ' + err.message, 'error');
      }
    }
    loadUsers();
  }, []);

  // Fetch documents when simulated user changes
  useEffect(() => {
    if (!currentUser) return;
    loadDocuments();
    
    // If there is an active document, re-fetch it to check access for the new simulated user
    if (activeDoc) {
      checkActiveDocAccess(activeDoc.id, currentUser.id);
    }
  }, [currentUser]);

  // Refetch documents when returning to dashboard (activeDoc becomes null)
  useEffect(() => {
    if (activeDoc === null && currentUser) {
      loadDocuments();
    }
  }, [activeDoc, currentUser]);

  const loadDocuments = async () => {
    try {
      const docs = await api.getDocuments(currentUser.id);
      setDocuments(docs);
    } catch (err) {
      showToast('Failed to load documents: ' + err.message, 'error');
    }
  };

  const checkActiveDocAccess = async (docId, userId) => {
    try {
      const updatedDoc = await api.getDocument(docId, userId);
      setActiveDoc(updatedDoc);
    } catch (err) {
      // Access denied or document not found for this user
      setActiveDoc(null);
      showToast('Access denied to that document for the switched user.', 'error');
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const closeToast = () => {
    setToast({ message: '', type: '' });
  };

  // Document actions
  const handleCreateDoc = async (title, content = '') => {
    try {
      const newDoc = await api.createDocument(title, content, currentUser.id);
      showToast(`Created document "${title}"`, 'success');
      await loadDocuments();
      return newDoc;
    } catch (err) {
      showToast('Failed to create document: ' + err.message, 'error');
      throw err;
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.deleteDocument(docId, currentUser.id);
      showToast('Document deleted', 'success');
      await loadDocuments();
      if (activeDoc && activeDoc.id === docId) {
        setActiveDoc(null);
      }
    } catch (err) {
      showToast('Failed to delete document: ' + err.message, 'error');
    }
  };

  const handleSelectUser = (userId) => {
    const selected = users.find(u => u.id === userId);
    if (selected) {
      setCurrentUser(selected);
    }
  };

  // Local state update when saving, so Dashboard is instantly synced
  const handleUpdateDocList = (docId, updatedTitle, updatedContent) => {
    setDocuments(prevDocs => 
      prevDocs.map(d => d.id === docId ? { ...d, title: updatedTitle, updated_at: new Date().toISOString() } : d)
    );
    setActiveDoc(prevActive => 
      prevActive && prevActive.id === docId ? { ...prevActive, title: updatedTitle, content: updatedContent } : prevActive
    );
  };

  return (
    <div className="app-layout">
      <Header 
        users={users} 
        currentUser={currentUser} 
        onSelectUser={handleSelectUser}
        activeDoc={activeDoc}
        onBackToDashboard={() => setActiveDoc(null)}
      />

      <main className="app-main-content">
        {currentUser ? (
          activeDoc ? (
            <EditorArea 
              activeDoc={activeDoc} 
              currentUser={currentUser} 
              users={users}
              onBackToDashboard={() => setActiveDoc(null)}
              onUpdateDocList={handleUpdateDocList}
              showToast={showToast}
            />
          ) : (
            <Dashboard 
              documents={documents} 
              currentUser={currentUser} 
              onCreateDoc={handleCreateDoc}
              onDeleteDoc={handleDeleteDoc}
              onSelectDoc={setActiveDoc}
              showToast={showToast}
            />
          )
        ) : (
          <div className="app-loading">
            <div className="spinner"></div>
            <p>Initializing Ajaia DocuFlow...</p>
          </div>
        )}
      </main>

      <Toast 
        message={toast.message} 
        type={toast.type} 
        onClose={closeToast} 
      />
    </div>
  );
}
