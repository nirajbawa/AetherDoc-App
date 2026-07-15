"use client";

import React, { useRef, useEffect } from "react";
import {
  FileText,
  X,
  CheckCircle2,
  Loader2,
  Terminal as TerminalIcon,
  ShieldCheck,
  Download,
  AlertCircle,
  Clock,
  Sparkles
} from "lucide-react";

interface WorkspaceProps {
  status: "active" | "completed" | "failed" | "compiling";
  documentTitle: string;
  documentDraft: string | null;
  docxPath: string | null;
  compileLogs: string[];
  isCompiling: boolean;
  isWorkspaceOpen: boolean;
  onCloseWorkspace: () => void;
  onDownload: () => void;
}

export default function Workspace({
  status,
  documentTitle,
  documentDraft,
  docxPath,
  compileLogs,
  isCompiling,
  isWorkspaceOpen,
  onCloseWorkspace,
  onDownload
}: WorkspaceProps) {
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll compilation logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [compileLogs]);

  return (
    <section
      className={`${
        isWorkspaceOpen ? "w-80 md:w-96" : "w-0"
      } shrink-0 bg-gray-900/60 border-l border-gray-800/80 flex flex-col transition-all duration-300 overflow-hidden relative z-30`}
    >
      {/* Panel Header */}
      <div className="p-4 border-b border-gray-800/80 flex items-center justify-between bg-gray-950/20">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-violet-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
            Document Workspace
          </span>
        </div>
        <button
          onClick={onCloseWorkspace}
          className="text-gray-500 hover:text-gray-300 p-1 hover:bg-gray-800 rounded"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Main Panel Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar flex flex-col">
        
        {status === "active" ? (
          // CLEAN IDLE CHAT STATE: Do not show stepper or placeholders!
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-500 text-xs gap-3">
            <div className="p-3 bg-violet-600/5 text-violet-400/80 border border-violet-500/10 rounded-2xl mb-1.5 animate-pulse">
              <Sparkles className="h-7 w-7" />
            </div>
            <span className="font-bold text-gray-300 text-xs">Ready to Compile</span>
            <p className="max-w-[200px] leading-relaxed text-gray-500 text-[11px]">
              Brainstorm and draft content in the chat. When satisfied, click <strong className="text-violet-400 font-medium">Compile Document</strong> in the top toolbar to export to a styled Word file.
            </p>
          </div>
        ) : (
          // ACTIVE COMPILING OR FINISHED STATES: Show details
          <div className="space-y-6 flex-1 flex flex-col">
            
            {/* Stepper Status list */}
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">
                Compilation Status
              </span>
              
              <div className="bg-gray-950 border border-gray-850/60 rounded-xl p-4 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                    status === "completed" ? "bg-emerald-500 shadow-md shadow-emerald-500/50" :
                    status === "compiling" ? "bg-violet-500 animate-ping" : "bg-red-500"
                  }`} />
                  <span className="text-xs font-bold text-gray-300 capitalize">
                    {status}
                  </span>
                </div>

                {/* Progress checklist */}
                <div className="space-y-3 pl-1 font-mono text-[11px] text-gray-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-violet-400" />
                    <span>Drafting Chat Content</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {status === "compiling" ? (
                      <Loader2 className="h-4 w-4 text-violet-400 animate-spin" />
                    ) : (
                      <CheckCircle2 className={`h-4 w-4 ${status === "completed" ? "text-violet-400" : "text-gray-700"}`} />
                    )}
                    <span>Structuring Layout & Margin Settings</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`h-4 w-4 ${status === "completed" ? "text-violet-400" : "text-gray-700"}`} />
                    <span>Final Word Doc Compilation</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Compilation Logs Console Terminal */}
            {compileLogs.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block flex items-center gap-1.5">
                  <TerminalIcon className="h-3 w-3 text-emerald-400" />
                  Compilation Trace Logs
                </span>
                <div className="bg-gray-950 border border-gray-850 rounded-xl p-3 h-44 font-mono text-[10px] overflow-y-auto custom-scrollbar flex flex-col gap-1.5 select-text">
                  {compileLogs.map((log, idx) => (
                    <div key={idx} className="text-gray-400 border-l border-violet-500/20 pl-2 leading-relaxed">
                      {log}
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              </div>
            )}

            {/* Document Draft Preview block */}
            {documentDraft && (
              <div className="flex flex-col gap-2.5">
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">
                  Draft Preview Summary
                </span>
                <div className="bg-gray-950/80 border border-gray-850 rounded-xl p-4 space-y-3">
                  <div className="text-xs font-bold text-gray-300 border-b border-gray-850 pb-2">
                    📄 {documentTitle}
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed font-mono whitespace-pre-wrap truncate max-h-[180px]">
                    {documentDraft}
                  </p>
                  <div className="text-[10px] text-gray-500 italic mt-2">
                    Word document is formatted with template typography rules.
                  </div>
                </div>
              </div>
            )}

            {/* Compiled Download card */}
            {status === "completed" && (
              <div className="bg-emerald-950/10 border border-emerald-500/20 rounded-xl p-4 flex flex-col gap-3 animate-fade-in mt-auto">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-300">Word file is compiled!</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Your structured outline sections have been styled, formatted, and exported.
                </p>
                <button
                  onClick={onDownload}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 shadow shadow-emerald-950/20"
                >
                  <Download className="h-4 w-4" />
                  Download Document
                </button>
              </div>
            )}

            {/* Failure state */}
            {status === "failed" && (
              <div className="bg-red-950/10 border border-red-500/20 rounded-xl p-4 flex flex-col gap-3 animate-fade-in mt-auto">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <span className="text-xs font-bold text-red-300">Compilation Failed</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  An error occurred during agent compilation. Check the trace logs above.
                </p>
              </div>
            )}
            
          </div>
        )}
      </div>
    </section>
  );
}
