# AetherDoc Testing Guide & Feature Checklist

This document details the implemented full-stack functionalities from the Product Requirements Document (PRD), additional layout enhancements, and sample prompt scenarios to verify agent execution.

---

## 1. Implemented Features & Functionality

### 📋 Core Features (From PRD)
- **FastAPI Backend Services:**
  - `POST /api/chat/message`: Main execution loop that receives prompts and streams AI replies.
  - `GET /api/chat/sessions`: Fetches all saved MongoDB session logs for historical listing.
  - `GET /api/chat/session/{session_id}`: Retrieves deep state metrics and draft arrays.
  - `DELETE /api/chat/session/{session_id}`: Deletes a session log from MongoDB.
  - `GET /api/chat/download/{session_id}`: Streams the generated styled `.docx` file as an openxml stream.
- **Agent Architecture (`python-docx` + LangChain):**
  - Sequentially drafts outline sections and performs self-reflection checkups.
  - Generates Navy-themed Microsoft Word documents with 24pt titles, 18pt/14pt headers, custom margins, page numbers, callout blocks, and alternating shaded table rows.
- **Premium Frontend Dashboard (Next.js):**
  - Glassmorphic dark-mode interface styled with a violet theme.
  - Real-time compilation status checklist steppers and scrolling stdout logs.
  - Clean welcome screen presets grid to quickly trigger test prompts.

### ✨ Extended Layout & Usability Enhancements
- **Dynamic Textarea Auto-growth:** The single-line chatbox expands dynamically up to `180px` as you type multiline prompts, and shrinks back automatically when cleared.
- **Left Sidebar Default Visibility & Desktop Toggles:** The chat history panel starts open by default on desktop, and is toggleable via a navbar Menu button on all screen sizes.
- **No Mock Fallback Sessions:** Standardized on strict database API loading. If MongoDB database is empty, the dashboard defaults to a clean, empty state without inserting mock data (such as "Clean Energy IoT Proposal").
- **Browser URL Syncing:** Appends and reads active session IDs from the search URL query parameters (`?session=session_id`) on updates, page refreshes, and session creations.
- **Quick Compile Button:** A dedicated violet `Layers` icon sits on the left of the chatbox to instantly submit a compilation request in one click.
- **Inline Download Cards:** Automatically intercepts markdown anchor links (containing `.docx` or pointing to the `download` target) and converts them into an interactive download card directly in the chat history bubble, completely hiding raw Windows absolute paths.

---

## 2. Verification Scenarios & Sample Prompts

### 🧪 Scenario 1: Standard Business Proposal (Test Case 1)
- **Objective:** Verify formatting, table styling, and chronological outlines.
- **Prompt:**
  ```text
  Draft a Project Proposal for a Clean Energy IoT analytics dashboard. The proposal must include a brief overview, a list of deliverables, project timeline in table format, and cost estimations.
  ```

### 🧪 Scenario 2: Complex Technical Migration SOP (Test Case 2)
- **Objective:** Verify assumption planning, contingency steps, and technical detailing.
- **Prompt:**
  ```text
  Create a technical SOP for migrating databases from our legacy on-prem PostgreSQL server (version 10, running on CentOS) to AWS Aurora PostgreSQL Serverless. The system serves 5,000 active users. We don't have the exact network topology documentation, but security is highly strict and we cannot tolerate more than 30 minutes of downtime. We need fallback steps if the migration fails.
  ```

### 🧪 Scenario 3: Custom Outline Generation
- **Objective:** Verify markdown parsing (list structures, bold font highlights, headers).
- **Prompt:**
  ```text
  Draft a Standard Operating Procedure (SOP) for incident management. Outline target levels, response protocols, and escalation pathways.
  ```

### 🧪 Scenario 4: Word Document Compilation Trigger
- **Objective:** Verify step-by-step trace compilation, layout generation, and inline download card presentation.
- **Prompt:**
  - Type `compile document` in the chat input and hit Enter, OR
  - Click the **Quick Compile Button** (the violet `Layers` icon on the left of the chatbox input).

---

## 3. One Real Engineering Improvement

We have implemented two core architectural features to satisfy the engineering improvement requirements: **Conversation Memory** and **Tool Calling**.

### 3.1 Conversation Memory
- **What was implemented:** A database-backed conversation history synchronization framework using MongoDB. The backend records human prompts and assistant replies. Upon receiving subsequent messages, it reconstructs context history by compiling a chronologically sorted sequence of `HumanMessage` and `AIMessage` nodes, which are then passed into the agent loop.
- **Why we chose it:** Stateless LLMs suffer from context drift and forget outline sections across multiple turns. In order to draft complex, multi-chapter documents successfully, the agent must recall constraints, notes, and guidelines discussed earlier in the chat.
- **How it improves the agent:** It guarantees architectural integrity and prevents hallucinations. The agent remembers constraints (such as database server types or active user levels) discussed sections prior, ensuring that when compilation is requested, the document compiles with zero drift.

### 3.2 Tool Calling
- **What was implemented:** A specialized `@tool` endpoint (`compile_document_tool`) bound to a LangGraph `react` agent graph. When a compilation trigger (e.g. `"compile document"` or the Quick Compile button) is detected, the agent routes the session structure payload into the Python execution tool.
- **Why we chose it:** Text-generation LLMs are highly non-deterministic and cannot directly construct binary files like `.docx` documents. Bridging the LLM with a dedicated compiler script allows the agent to generate formatted corporate documents reliably.
- **How it improves the agent:** It delegates file operations to structured python-docx logic. The agent is freed from trying to simulate document formatting, enabling it to write content in clean markdown blocks while the backend ensures margins, colors, page numbers, callout blocks, and alternating shaded table rows are styled with high precision.

### 3.3 Error Handling & Recovery
- **What was implemented:** A multi-tier error handling policy that spans both Next.js UI elements and backend route definitions:
  - *Network Resilience:* The frontend catches Axios query errors (like an offline FastAPI instance or down database), displaying a warning box in the chat feed instead of letting the application crash.
  - *Database Fallbacks:* If MongoDB operations throw errors on initial loads, the frontend falls back to browser `localStorage` to load and save conversations seamlessly.
  - *Compiler Exception Logging:* Tool execution crashes are intercepted, marking status as `failed` and appending detailed CLI error trace messages directly to the Workspace log drawer.
- **Why we chose it:** Stateful web apps must handle connection cuts, LLM timeouts, and DB restarts gracefully rather than freezing the dashboard.
- **How it improves the agent:** It ensures high availability and robustness. The user receives clear visual instructions on how to recover (e.g. restart backend or check database credentials) and never experiences silent screen freezes.
