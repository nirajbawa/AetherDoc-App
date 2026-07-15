"use client";

import React, { useRef, useEffect } from "react";
import {
  Sparkles,
  Loader2,
  Send,
  Layers,
  CheckCircle2,
  Download,
  FileText,
  Info,
  Menu,
  ShieldCheck
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

interface Preset {
  label: string;
  desc: string;
  prompt: string;
}

interface ChatAreaProps {
  activeSession: ChatSession | null;
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  onSendMessage: (e?: React.FormEvent, customText?: string) => void;
  onDownload: () => void;
  presets: Preset[];
  onToggleSidebar: () => void;
}

export default function ChatArea({
  activeSession,
  input,
  setInput,
  isLoading,
  onSendMessage,
  onDownload,
  presets,
  onToggleSidebar
}: ChatAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  return (
    <section className="flex-1 flex flex-col min-w-0 bg-gray-950 relative">
      
      {/* 1. Header Toolbar */}
      <header className="h-16 border-b border-gray-800/80 px-6 flex items-center justify-between bg-gray-900/30 glass-panel">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="text-gray-500 hover:text-gray-300 p-1 hover:bg-gray-850 rounded mr-1"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-bold text-gray-200 truncate max-w-[200px] md:max-w-md">
            {activeSession ? activeSession.title : "Select a Session"}
          </span>
        </div>

        <div className="flex items-center gap-3">
        </div>
      </header>

      {/* 2. Chat Feed area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 custom-scrollbar">
        {activeSession && activeSession.messages.length === 0 ? (
          // Welcome view
          <div className="max-w-2xl mx-auto pt-8 flex flex-col gap-8">
            <div className="text-center flex flex-col gap-2.5">
              <div className="mx-auto p-4 bg-gradient-to-tr from-violet-600 to-indigo-500 rounded-2xl shadow-xl shadow-indigo-600/10 w-fit">
                <Sparkles className="h-8 w-8 text-white animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mt-2">
                Document Generation Assistant
              </h2>
              <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                Collaborate in chat to compile professional, styled Word (.docx) files autonomously.
              </p>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {presets.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => onSendMessage(undefined, preset.prompt)}
                  className="text-left p-4 rounded-2xl border border-gray-900 bg-gray-900/20 hover:bg-gray-900/60 hover:border-gray-800/80 hover:shadow-lg transition-all duration-200 group flex flex-col gap-2"
                >
                  <span className="text-sm font-semibold text-violet-400 block group-hover:text-violet-300">
                    {preset.label}
                  </span>
                  <span className="text-[13px] text-gray-500 block leading-relaxed line-clamp-3">
                    {preset.prompt}
                  </span>
                </button>
              ))}
            </div>

            <div className="glass-panel border border-gray-900 rounded-2xl p-4 flex gap-3 text-xs text-gray-400">
              <Info className="h-5 w-5 text-violet-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Provide parameters such as timelines, resources, objectives, and structures. The agent designs sections, checks for errors, and calls templates to assemble the final output file.
              </p>
            </div>
          </div>
        ) : (
          // Messages list
          <div className="max-w-3xl mx-auto space-y-6">
            {activeSession?.messages.map((msg, index) => {
              const isUser = msg.role === "user";

              return (
                <div
                  key={index}
                  className={`flex items-start gap-4 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div className="h-8 w-8 bg-gray-900 border border-gray-800 text-violet-400 flex items-center justify-center rounded-xl shadow-md shrink-0">
                      <Sparkles className="h-4 w-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-4.5 py-4 text-[15px] leading-relaxed ${
                      isUser
                        ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-tr-none shadow-md shadow-violet-950/20"
                        : "bg-gray-900/60 border border-gray-855/60 text-gray-200 rounded-tl-none font-sans"
                    }`}
                  >
                    <div className="select-text">
                      {isUser ? (
                        <div className="whitespace-pre-wrap select-text">
                          {msg.content}
                        </div>
                      ) : (
                        <div className="prose prose-invert max-w-none text-[15px] select-text leading-relaxed space-y-2.5">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              h1: ({ ...props }) => <h1 className="text-lg font-bold mt-4 mb-2 text-white" {...props} />,
                              h2: ({ ...props }) => <h2 className="text-base font-bold mt-3 mb-1.5 text-white" {...props} />,
                              h3: ({ ...props }) => <h3 className="text-[15px] font-semibold mt-2.5 mb-1 text-white" {...props} />,
                              p: ({ ...props }) => <p className="mb-2 leading-relaxed text-gray-300" {...props} />,
                              table: ({ ...props }) => <div className="overflow-x-auto my-2 border border-gray-800 rounded-xl"><table className="min-w-full divide-y divide-gray-800 text-[13px] bg-gray-900/40" {...props} /></div>,
                              thead: ({ ...props }) => <thead className="bg-gray-955/60" {...props} />,
                              tbody: ({ ...props }) => <tbody className="divide-y divide-gray-850" {...props} />,
                              th: ({ ...props }) => <th className="px-3 py-2 text-left font-semibold text-gray-400 border-r border-gray-850 last:border-r-0" {...props} />,
                              td: ({ ...props }) => <td className="px-3 py-2 text-gray-300 border-r border-gray-850 last:border-r-0" {...props} />,
                              ul: ({ ...props }) => <ul className="list-disc pl-4 mb-2 space-y-1 text-gray-300" {...props} />,
                              ol: ({ ...props }) => <ol className="list-decimal pl-4 mb-2 space-y-1 text-gray-300" {...props} />,
                              li: ({ ...props }) => <li className="pl-0.5" {...props} />,
                              code: ({ ...props }) => <code className="bg-gray-955 px-1.5 py-0.5 rounded font-mono text-[13px] text-pink-400 border border-gray-900" {...props} />,
                              pre: ({ ...props }) => <pre className="bg-gray-955 p-3 rounded-2xl border border-gray-900 my-2 font-mono text-[13px] text-gray-300 overflow-x-auto" {...props} />,
                              strong: ({ ...props }) => <strong className="font-semibold text-white" {...props} />,
                              a: ({ href, children, ...props }) => {
                                const isDocxLink = href?.toLowerCase().endsWith(".docx") || 
                                                   href?.toLowerCase().includes("generated_docs") ||
                                                   href?.toLowerCase() === "download";
                                if (isDocxLink) {
                                  return (
                                    <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-4 flex flex-col gap-3 my-4 max-w-sm shadow-lg animate-fade-in">
                                      <div className="flex items-center gap-2.5">
                                        <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
                                          <ShieldCheck className="h-4.5 w-4.5 animate-pulse" />
                                        </div>
                                        <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Document Compiled</span>
                                      </div>
                                      <p className="text-xs text-gray-400 leading-relaxed">
                                        Your outline draft has been successfully exported as a beautifully styled Word file.
                                      </p>
                                      <button
                                        type="button"
                                        onClick={onDownload}
                                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 shadow shadow-emerald-950/20 transition-all cursor-pointer"
                                      >
                                        <Download className="h-3.5 w-3.5" />
                                        Download Word Document (.docx)
                                      </button>
                                    </div>
                                  );
                                }
                                return <a className="text-violet-400 hover:text-violet-300 underline font-medium" href={href} {...props}>{children}</a>;
                              }
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Skeleton loader bubble */}
            {isLoading && (
              <div className="flex items-start gap-4 justify-start">
                <div className="h-8 w-8 bg-gray-900 border border-gray-800 text-violet-400 flex items-center justify-center rounded-xl shrink-0 animate-pulse">
                  <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
                </div>
                <div className="bg-gray-900/40 border border-gray-855/40 rounded-2xl rounded-tl-none px-4 py-3.5 w-32 flex gap-1 items-center justify-center">
                  <span className="h-2 w-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Footer input area */}
      <div className="p-4 md:p-6 border-t border-gray-900 bg-gray-950">
        <div className="max-w-3xl mx-auto">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (!isLoading && input.trim() && activeSession) {
                onSendMessage(e);
              }
            }} 
            className="relative flex items-end gap-2.5"
          >
            {/* Quick Compile button to the left of the input textarea */}
            <button
              type="button"
              onClick={() => onSendMessage(undefined, "compile document")}
              disabled={isLoading || !activeSession}
              className="p-3.5 bg-gray-900 border border-gray-855 hover:bg-gray-800 disabled:bg-gray-900 disabled:opacity-50 text-violet-400 disabled:text-gray-650 rounded-2xl transition-colors cursor-pointer shadow-inner shrink-0 mb-0.5 flex items-center justify-center"
              title="Quick Compile Document"
            >
              <Layers className="h-4.5 w-4.5" />
            </button>

            <div className="relative flex-1 flex items-end">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={!activeSession}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!isLoading && input.trim() && activeSession) {
                      onSendMessage(e);
                    }
                  }
                }}
                placeholder={
                  !activeSession
                    ? "Select or create a chat session to start..."
                    : "Collaborate here to draft content... type 'compile document' when satisfied."
                }
                className="w-full bg-gray-900 border border-gray-855 hover:border-gray-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none rounded-2xl pl-4 pr-12 py-3.5 text-[15px] placeholder-gray-500 text-gray-200 transition-colors shadow-inner resize-none min-h-[52px] max-h-[160px] custom-scrollbar overflow-y-auto"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading || !activeSession}
                className="absolute right-2.5 bottom-2.5 p-2 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-800 text-white disabled:text-gray-600 rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
          <p className="text-[10px] text-gray-600 text-center mt-2.5">
            Powered by Autonomous Document Planner Agent. Use presets to instantly generate templates.
          </p>
        </div>
      </div>
    </section>
  );
}
