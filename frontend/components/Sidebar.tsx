"use client";

import React, { useState } from "react";
import { Sparkles, Plus, MessageSquare, Edit2, Trash2, X } from "lucide-react";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  status: "active" | "completed" | "failed" | "compiling";
  documentDraft: string | null;
  docxPath: string | null;
  createdAt: string;
}

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  isSidebarOpen: boolean;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onCloseSidebar: () => void;
}

export default function Sidebar({
  sessions,
  activeSessionId,
  isSidebarOpen,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  onRenameSession,
  onCloseSidebar
}: SidebarProps) {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const startRename = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(id);
    setEditingTitle(currentTitle);
  };

  const saveRename = (id: string) => {
    if (editingTitle.trim()) {
      onRenameSession(id, editingTitle.trim());
    }
    setEditingSessionId(null);
  };

  return (
    <aside
      className={`${
        isSidebarOpen ? "w-64 md:w-72" : "w-0"
      } shrink-0 bg-gray-900/90 border-r border-gray-800/80 flex flex-col transition-all duration-300 overflow-hidden relative z-40`}
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-gradient-to-tr from-violet-600 to-indigo-500 rounded-lg shadow-lg shadow-indigo-500/20 shrink-0">
            <Sparkles className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <span className="text-sm font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              AetherDoc Workspace
            </span>
          </div>
        </div>
        <button
          onClick={onCloseSidebar}
          className="md:hidden text-gray-500 hover:text-gray-300 p-1 hover:bg-gray-800 rounded"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* New Chat Trigger */}
      <div className="p-3">
        <button
          onClick={onCreateSession}
          className="w-full bg-violet-600/10 hover:bg-violet-600/20 border border-violet-500/20 hover:border-violet-500/40 text-violet-300 font-semibold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-150 animate-fade-in"
        >
          <Plus className="h-4 w-4" />
          New Document Chat
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1.5 custom-scrollbar">
        <span className="text-[10px] font-mono text-gray-600 uppercase tracking-wider px-3 block mb-2">
          History Sessions
        </span>
        {sessions.map((session) => {
          const isActive = session.id === activeSessionId;
          const isEditing = editingSessionId === session.id;

          return (
            <div
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer border transition-all duration-150 relative ${
                isActive
                  ? "bg-violet-950/20 border-violet-500/30 text-violet-200"
                  : "bg-transparent border-transparent hover:bg-gray-850/40 text-gray-400 hover:text-gray-200"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <MessageSquare className={`h-4 w-4 shrink-0 ${isActive ? "text-violet-400" : "text-gray-600"}`} />
                
                {isEditing ? (
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={() => saveRename(session.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveRename(session.id);
                      if (e.key === "Escape") setEditingSessionId(null);
                    }}
                    autoFocus
                    className="bg-gray-950 border border-violet-500 text-xs rounded px-1.5 py-0.5 focus:outline-none w-full text-white"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="text-xs font-medium truncate block">{session.title}</span>
                )}
              </div>

              {/* Hover Action Buttons */}
              {!isEditing && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => startRename(session.id, session.title, e)}
                    className="p-1 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded"
                    title="Rename"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => onDeleteSession(session.id, e)}
                    className="p-1 text-gray-500 hover:text-red-400 hover:bg-gray-800 rounded"
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer info */}
      <div className="p-3 bg-gray-950/40 border-t border-gray-800/80 text-[10px] text-gray-600 font-mono flex items-center justify-between">
        <span>💾 Sessions autosaved</span>
        <span>v1.0</span>
      </div>
    </aside>
  );
}
