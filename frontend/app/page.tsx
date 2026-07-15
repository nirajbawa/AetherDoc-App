"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import ChatArea from "../components/ChatArea";
import Workspace from "../components/Workspace";

// Define Interfaces matching backend responses
export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  status: "active" | "compiling" | "completed" | "failed";
  documentDraft: string | null;
  docxPath: string | null;
  createdAt: string;
}

export interface Preset {
  label: string;
  desc: string;
  prompt: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

export default function Home() {
  const WELCOME_MESSAGE_CONTENT = 
    "Hello! I am your Autonomous Document Generation Assistant. I can help you draft, outline, " +
    "and refine professional business or technical documents (such as proposals, meeting minutes, " +
    "project plans, SOPs, or specifications) directly in this chat. \n\n" +
    "Once you are satisfied with the draft sections, type **\"compile document\"** and I will compile " +
    "the contents into a beautifully formatted Microsoft Word (.docx) document matching your corporate " +
    "styles. How can I help you get started today?";

  const welcomeMessage: Message = {
    role: "assistant",
    content: WELCOME_MESSAGE_CONTENT,
    timestamp: new Date().toISOString()
  };

  // Global States
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [compileLogs, setCompileLogs] = useState<string[]>([]);
  const [input, setInput] = useState<string>("");

  // 1. Initial Loading from DB API or fallback
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/chat/sessions`);
        const apiSessions = res.data;
        
        const params = new URLSearchParams(window.location.search);
        const urlSessionId = params.get("session");
        
        if (apiSessions && apiSessions.length > 0) {
          const mappedSessions: ChatSession[] = apiSessions.map((s: any) => ({
            id: s.session_id,
            title: s.title || (s.messages && s.messages.length > 0 
              ? s.messages[0].content.split(" ").slice(0, 4).join(" ") + (s.messages[0].content.split(" ").length > 4 ? "..." : "")
              : `Session ${s.session_id.substring(0, 6)}`),
            messages: s.messages || [],
            status: s.status || "active",
            documentDraft: s.document_draft || null,
            docxPath: s.docx_path || null,
            createdAt: s.created_at || new Date().toISOString()
          }));
          
          setSessions(mappedSessions);
          
          const sessionExists = mappedSessions.some(s => s.id === urlSessionId);
          if (urlSessionId && sessionExists) {
            setActiveSessionId(urlSessionId);
          } else {
            setActiveSessionId(mappedSessions[0].id);
          }
        } else {
          setSessions([]);
          setActiveSessionId("");
        }
      } catch (err) {
        console.error("Failed to load sessions from API, falling back to local storage:", err);
        const params = new URLSearchParams(window.location.search);
        const urlSessionId = params.get("session");
        
        const saved = localStorage.getItem("aetherdoc_sessions");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed && parsed.length > 0) {
              setSessions(parsed);
              const sessionExists = parsed.some((s: any) => s.id === urlSessionId);
              if (urlSessionId && sessionExists) {
                setActiveSessionId(urlSessionId);
              } else {
                setActiveSessionId(parsed[0].id);
              }
              return;
            }
          } catch (e) {
            console.error("Failed to parse saved sessions", e);
          }
        }
        
        setSessions([]);
        setActiveSessionId("");
      }
    };

    loadSessions();
  }, []);

  // 2. Sync to browser local storage (as secondary fallback)
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem("aetherdoc_sessions", JSON.stringify(sessions));
    } else {
      localStorage.removeItem("aetherdoc_sessions");
    }
  }, [sessions]);

  // 3. Update browser URL when switching sessions
  useEffect(() => {
    const url = new URL(window.location.href);
    if (activeSessionId) {
      if (url.searchParams.get("session") !== activeSessionId) {
        url.searchParams.set("session", activeSessionId);
        window.history.pushState(null, "", url.pathname + url.search);
      }
    } else {
      // Clear stale session param when no sessions remain
      if (url.searchParams.has("session")) {
        url.searchParams.delete("session");
        window.history.pushState(null, "", url.pathname);
      }
    }
  }, [activeSessionId]);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  // 4. Toggle workspace sidebar visibility dynamically based on active session status changes
  useEffect(() => {
    if (!activeSession) return;
    if (activeSession.status === "completed" || activeSession.status === "compiling") {
      setIsWorkspaceOpen(true);
    } else {
      setIsWorkspaceOpen(false);
    }
  }, [activeSessionId, activeSession?.status]);

  // 5. Sync session metrics from backend (skip for local-only to suppress console 404s)
  useEffect(() => {
    if (!activeSessionId) return;

    const syncSession = async () => {
      try {
        // Guard: skip if session was deleted from local state
        const current = sessions.find(s => s.id === activeSessionId);
        if (!current) return;

        const hasUserMessages = current.messages.some((m) => m.role === "user");
        if (!hasUserMessages) return;

        const res = await axios.get(`${API_BASE_URL}/chat/session/${activeSessionId}`);
        const data = res.data;
        
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSessionId
              ? {
                  ...s,
                  messages: data.messages || [],
                  status: data.status || "active",
                  documentDraft: data.document_draft || null,
                  docxPath: data.docx_path || null
                }
              : s
          )
        );
      } catch (err: any) {
        // Only log non-404 errors to avoid noise from deleted sessions
        if (err?.response?.status !== 404) {
          console.error("Failed to sync session from backend:", err);
        }
      }
    };

    syncSession();
  }, [activeSessionId]);

  // Presets configuration
  const presets: Preset[] = [
    {
      label: "Standard Business Proposal",
      desc: "Clean Energy IoT Dashboard",
      prompt: "Draft a Project Proposal for a Clean Energy IoT analytics dashboard. The proposal must include a brief overview, a list of deliverables, project timeline in table format, and cost estimations."
    },
    {
      label: "Complex Technical SOP",
      desc: "PostgreSQL to AWS Aurora Migration",
      prompt: "Create a technical SOP for migrating databases from our legacy on-prem PostgreSQL server (version 10, running on CentOS) to AWS Aurora PostgreSQL Serverless. The system serves 5,000 active users. We don't have the exact network topology documentation, but security is highly strict and we cannot tolerate more than 30 minutes of downtime. We need fallback steps if the migration fails."
    }
  ];

  // Action: Create Session
  const handleCreateSession = () => {
    const newId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: "New Chat Session",
      messages: [welcomeMessage],
      status: "active",
      documentDraft: null,
      docxPath: null,
      createdAt: new Date().toISOString()
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
    setInput("");
    setCompileLogs([]);
    setIsCompiling(false);
    setIsWorkspaceOpen(false);
  };

  // Action: Delete Session (Axios DELETE request)
  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      await axios.delete(`${API_BASE_URL}/chat/session/${id}`);
    } catch (err) {
      console.error("Failed to delete session on backend:", err);
    }
    
    const remaining = sessions.filter((s) => s.id !== id);
    
    if (remaining.length === 0) {
      setSessions([]);
      setActiveSessionId("");
      setIsWorkspaceOpen(false);
    } else {
      setSessions(remaining);
      if (activeSessionId === id) {
        setActiveSessionId(remaining[0].id);
      }
    }
  };

  // Action: Rename Session
  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle } : s))
    );
  };

  // Action: Send message (Axios)
  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText || input;
    if (!textToSend.trim() || !activeSession || isLoading) return;

    setInput("");

    const userMessage: Message = {
      role: "user",
      content: textToSend,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...activeSession.messages, userMessage];

    // Automatically name session based on prompt
    let newTitle = activeSession.title;
    if (activeSession.title === "New Chat Session" || activeSession.title === "Clean Energy IoT Proposal") {
      newTitle = textToSend.split(" ").slice(0, 4).join(" ") + (textToSend.split(" ").length > 4 ? "..." : "");
    }

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSession.id
          ? { ...s, title: newTitle, messages: updatedMessages }
          : s
      )
    );

    setIsLoading(true);

    const isCompilationText = textToSend.trim() === "compile document" || textToSend.trim().toLowerCase().includes("generate docx");
    if (isCompilationText) {
      setIsCompiling(true);
      setIsWorkspaceOpen(true);
      setCompileLogs([
        `[HTTP] POST /api/chat/message initiated...`,
        `[SYSTEM] Structuring layout, margins, and font bindings...`
      ]);
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/chat/message`, {
        session_id: activeSession.id,
        content: textToSend
      });

      const aiMessage: Message = {
        role: "assistant",
        content: res.data.response,
        timestamp: new Date().toISOString()
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSession.id
            ? {
                ...s,
                messages: [...updatedMessages, aiMessage],
                status: res.data.status,
                documentDraft: res.data.status === "completed" ? "Draft summary created." : null
              }
            : s
        )
      );

      if (isCompilationText) {
        setCompileLogs((prev) => [...prev, `[SYSTEM] Compiled successfully! Word document is exported.`]);
      }
    } catch (err: any) {
      console.error("Backend error calling axios:", err);
      const aiMessage: Message = {
        role: "assistant",
        content: `⚠️ **Failed to connect to FastAPI backend at ${API_BASE_URL}**\n\nVerify that the backend is running and the database is connected. (Error: ${err.message})`,
        timestamp: new Date().toISOString()
      };
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSession.id
            ? { ...s, messages: [...updatedMessages, aiMessage] }
            : s
        )
      );
      if (isCompilationText) {
        setCompileLogs((prev) => [...prev, `[ERROR] Compilation failed: ${err.message}`]);
      }
    } finally {
      setIsLoading(false);
      setIsCompiling(false);
    }
  };

  // Download compiled Word document
  const handleDownload = () => {
    if (!activeSession) return;
    window.open(`${API_BASE_URL}/chat/download/${activeSession.id}`, "_blank");
  };

  return (
    <div className="h-screen max-h-screen bg-gray-950 text-gray-100 flex font-sans overflow-hidden">
      
      {/* 1. Left Sidebar Panel */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        isSidebarOpen={isSidebarOpen}
        onSelectSession={(id) => {
          setActiveSessionId(id);
          setCompileLogs([]);
        }}
        onCreateSession={handleCreateSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onCloseSidebar={() => setIsSidebarOpen(false)}
      />

      {/* 2. Central ChatGPT Conversation View */}
      <ChatArea
        activeSession={activeSession}
        input={input}
        setInput={setInput}
        isLoading={isLoading}
        onSendMessage={handleSendMessage}
        onDownload={handleDownload}
        presets={presets}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* 3. Right Sidebar Document Workspace */}
      <Workspace
        status={activeSession ? activeSession.status : "active"}
        documentTitle={activeSession ? activeSession.title : ""}
        documentDraft={activeSession ? activeSession.documentDraft : null}
        docxPath={activeSession ? activeSession.docxPath : null}
        compileLogs={compileLogs}
        isCompiling={isCompiling}
        isWorkspaceOpen={isWorkspaceOpen}
        onCloseWorkspace={() => setIsWorkspaceOpen(false)}
        onDownload={handleDownload}
      />
      
    </div>
  );
}
