# AI-Native Workflow Note

This note details how AI tools were integrated during the development of Ajaia DocuFlow.

---

## 1. AI Tools Utilized
- **Assistant:** Gemini 3.5 Flash via Google DeepMind Antigravity Agent.
- **Role:** Pair programmer executing workspace actions, generating styling tokens, drafting database schemas, and setting up automated test frameworks.

---

## 2. Where AI Materially Sped Up Development
- **Database Joins & Queries:** The AI generated an optimized SQL `UNION` query in `backend/server.js` that pulls owned documents and shared documents, joins the owner metadata (name, color), and returns them pre-ordered in a single request. This saved time on mapping and stitching collections in Javascript.
- **Dark Mode Styling for Quill:** Quill.js is heavily styled for light themes by default. The AI was extremely helpful in generating CSS overrides for `.ql-toolbar`, `.ql-stroke`, `.ql-picker`, and picker panels, ensuring that the editor layout blended into our custom dark-theme glassmorphism style.
- **Supertest Mocking:** The AI quickly drafted a complete test pipeline matching standard Jest specs, including setting up standard SQLite in-memory modes during test runtime to prevent modifying the development SQLite database.

---

## 3. What AI-Generated Output was Changed or Rejected
- **mammoth.js & .docx Parser Integration:** The initial AI draft recommended importing mammoth.js on the backend to extract text from uploads of `.docx` files. This was rejected to keep backend dependencies clean and avoid native compilation errors on different development environments. Instead, we limited support to `.txt` and `.md` text files parsed on the client side.
- **react-quill React Wrapper:** The AI originally suggested importing `react-quill` or `react-quill-new`. We rejected this because React 18+ compilation environments often throw warnings or break on older React components. Instead, we instantiated the core `quill` library directly inside a React `useRef` + `useEffect` hook, which is robust, warning-free, and highly performant.
- **Full Socket.io Integration:** The AI proposed building full Socket.io synchronization for real-time cursor indicators. We rejected this suggestion to maintain focused scope, avoid running multi-threaded state syncing, and prioritize delivering a solid, bug-free, fully-persisted CRUD and sharing application.

---

## 4. Verification of Correctness & Reliability
- **Automated Verification:** We run automated API endpoints tests validating:
  - Document creation
  - Private document read prevention
  - Access granting via sharing
  - Update blocks on View-only users
- **UX & Flow Verification:** We manually verified the user experience by toggling between Alice, Bob, and Charlie and verifying that editing permissions adapt instantly, and that saving status badges react appropriately.
