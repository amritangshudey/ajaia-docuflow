# Ajaia DocuFlow - Collaborative Document Editor

Ajaia DocuFlow is a lightweight collaborative document editor inspired by Google Docs, built with a modern dark-theme glassmorphism UI. It offers real-time simulated user switching, document editing with auto-save, access controls (Viewer/Editor/Owner), file imports, and SQLite persistence.

---

## Technical Stack
- **Frontend:** React (Vite), Vanilla CSS, Quill.js Rich Text Editor.
- **Backend:** Node.js, Express.
- **Database:** SQLite (`sqlite3` driver).
- **Testing:** Jest, Supertest.

---

## Getting Started

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### 2. Install Dependencies
Run the following command at the project root directory to install dependencies for the root coordinator, frontend, and backend:
```bash
npm install && npm install --prefix backend && npm install --prefix frontend
```

### 3. Run the Application
Start both the Express API backend and Vite React frontend concurrently:
```bash
npm run dev
```
- **Frontend** will be active at: `http://localhost:5173`
- **Backend API** will be active at: `http://localhost:5001`
- The database (`backend/docuflow.db`) will be automatically initialized and seeded with test users on the first run.

### 4. Run Automated Tests
Run the integration test suite verifying backend routing and permissions:
```bash
npm test
```

---

## Key Workflows

### 👥 User Switching & Sharing
To test permissions without deploying real-world OAuth:
1. In the header bar, use the **"Simulating User"** dropdown in the top right to switch between **Alice**, **Bob**, and **Charlie**.
2. Create a document while logged in as **Alice**. 
3. Click the **Share** button in the editor toolbar, select **Bob** (or type `bob@ajaia.com`), set access to **Can View**, and click Share.
4. Switch the simulator to **Bob** in the header. The document will appear under Bob's "Shared with Me" tab. If Bob opens it, the editor will dynamically enter a **Read-only** state.
5. In Alice's window, upgrade Bob to **Can Edit**. Switch back to Bob's simulator and verify Bob can now type and edit the contents with auto-save active.

### 📥 File Imports
- Go to the Dashboard.
- Drag-and-drop a `.txt` or `.md` file anywhere inside the dotted drop-zone, or click the **Import File** button to select a file.
- The file's content will be read and saved as a new document under your ownership, and immediately opened for editing.

### 📤 File Exports
- Inside the editor, you can click the **TXT** or **MD** buttons in the toolbar to instantly download the current document state as a plain text or markdown file.
