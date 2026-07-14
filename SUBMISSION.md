# Submission Details - Ajaia DocuFlow

This document summarizes the files, features, and links included in the Ajaia DocuFlow collaborative editor submission.

## Deployed URL
* **Live App URL:** (Placeholder - Local testing setup provided. To run, use `npm run dev` at root)

## Included Artifacts and Deliverables
1. **Source Code**: Full-stack codebase located in the root folder.
   - `backend/`: Express server, database tables creation & default seeding, testing suite.
   - `frontend/`: React application configured via Vite, styled with custom dark-theme glassmorphism CSS, integrated with Quill.js editor.
2. **[README.md](file:///Users/amrit/Desktop/test/README.md)**: Local setup and running instructions.
3. **[architecture.md](file:///Users/amrit/Desktop/test/architecture.md)**: Details on our architectural decisions, data models, permissions structure, and tradeoffs.
4. **[ai_workflow.md](file:///Users/amrit/Desktop/test/ai_workflow.md)**: AI Native Workflow reflection note detailing tools, code rejects, and validation steps.
5. **Seeded Test Accounts**:
   - `alice@ajaia.com` (Simulated owner by default)
   - `bob@ajaia.com` (Simulated viewer/editor)
   - `charlie@ajaia.com` (Simulated viewer/editor)
   - *Switching users is performed dynamically using the Simulator dropdown in the top-right header.*

---

## Core Feature Status Checklist

- [x] **1. Document Creation & Editing**
  - Create new document (Instant template initialization)
  - Rename document (Auto-saves changes inline with debounce)
  - Edit contents (Quill rich-text editor, headers, lists, formatting)
  - Save & Reopen (SQLite database persistence + auto-save indicators)
- [x] **2. File Upload / Import**
  - Allow importing `.txt` and `.md` files to automatically generate documents (Drag-and-drop support on Dashboard + custom button)
  - Export utilities for downloading active documents as `.txt` or `.md`
- [x] **3. Sharing**
  - Access control with Owner, Editor, and Viewer permission levels
  - Dynamic user-switcher in header to simulate Alice/Bob/Charlie
  - Visual badges distinguishing owned, edit-shared, and view-shared items
  - Shared list management (Add/revoke user access by email or quick-click buttons)
- [x] **4. Persistence**
  - Fully integrated SQLite database (`backend/docuflow.db`) keeping document history, updates, and shares intact across app restarts and refreshes.
- [x] **5. Engineering Quality**
  - Complete integration testing suite running on Jest and Supertest with an isolated in-memory test database.
