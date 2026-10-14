import React from "react";
import {
  LayoutDashboard,
  Cpu,
  Boxes,
  History,
  BookOpen,
  HelpCircle,
  Plus,
  Clock,
} from "lucide-react";
import { TargetBoard, SavedCircuitProject } from "../types";

interface SidebarProps {
  currentProjectTitle?: string;
  targetBoard: TargetBoard;
  activeNav: string;
  onSelectNav: (nav: string) => void;
  onNewProject: () => void;
  onOpenCloudProjects: () => void;
  onOpenDocs: () => void;
  onOpenSupport: () => void;
  recentProjects?: SavedCircuitProject[];
  onSelectRecentProject?: (project: SavedCircuitProject) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentProjectTitle = "Project Alpha",
  targetBoard,
  activeNav,
  onSelectNav,
  onNewProject,
  onOpenCloudProjects,
  onOpenDocs,
  onOpenSupport,
  recentProjects = [],
  onSelectRecentProject,
}) => {
  return (
    <aside className="w-64 bg-[#0a0e12] border-r border-[#1a2226] flex flex-col justify-between shrink-0 select-none hidden md:flex h-[calc(100vh-65px)] sticky top-[65px]">
      <div className="p-4 space-y-6">
        {/* Project Card */}
        <div className="bg-[#12181b] border border-[#1f282c] rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/30 flex items-center justify-center shrink-0">
            <Cpu className="w-5 h-5 text-orange-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-semibold text-white truncate">{currentProjectTitle}</h4>
            <p className="text-[10px] text-slate-400 truncate mt-0.5">{targetBoard}</p>
          </div>
        </div>

        {/* New Project Button */}
        <button
          onClick={onNewProject}
          className="w-full bg-[#38bdf8]/15 hover:bg-[#38bdf8]/25 text-[#38bdf8] border border-[#38bdf8]/30 font-medium py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>

        {/* Navigation Links */}
        <div className="space-y-1">
          <button
            onClick={() => onSelectNav("workspace")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              activeNav === "workspace"
                ? "bg-[#182226] text-white border border-[#26343a]"
                : "text-slate-400 hover:text-white hover:bg-[#12181b]"
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-[#38bdf8]" />
            <span>Workspace</span>
          </button>

          <button
            onClick={() => onSelectNav("schematics")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              activeNav === "schematics"
                ? "bg-[#182226] text-white border border-[#26343a]"
                : "text-slate-400 hover:text-white hover:bg-[#12181b]"
            }`}
          >
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>Schematics</span>
          </button>

          <button
            onClick={() => onSelectNav("components")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              activeNav === "components"
                ? "bg-[#182226] text-white border border-[#26343a]"
                : "text-slate-400 hover:text-white hover:bg-[#12181b]"
            }`}
          >
            <Boxes className="w-4 h-4 text-amber-400" />
            <span>Components</span>
          </button>

          <button
            onClick={() => {
              onSelectNav("history");
              onOpenCloudProjects();
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              activeNav === "history"
                ? "bg-[#182226] text-white border border-[#26343a]"
                : "text-slate-400 hover:text-white hover:bg-[#12181b]"
            }`}
          >
            <History className="w-4 h-4 text-purple-400" />
            <span>History</span>
          </button>
        </div>

        {/* Recent Projects Section */}
        {recentProjects.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-[#1a2226]">
            <div className="flex items-center justify-between px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-orange-400" />
                <span>Recent</span>
              </span>
              <span className="text-[9px] bg-[#182226] text-slate-400 px-1.5 py-0.5 rounded-md font-mono">
                {Math.min(recentProjects.length, 3)}
              </span>
            </div>
            <div className="space-y-1">
              {recentProjects.slice(0, 3).map((proj) => (
                <button
                  key={proj.id}
                  onClick={() => onSelectRecentProject && onSelectRecentProject(proj)}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer hover:bg-[#12181b] group flex items-center justify-between"
                  title={proj.title}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="text-slate-300 font-medium truncate group-hover:text-white">
                      {proj.title}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">{proj.targetBoard}</p>
                  </div>
                  <span className="text-[10px] text-orange-400/70 group-hover:text-orange-400 shrink-0 font-mono">
                    Load
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Footer Links */}
      <div className="p-4 border-t border-[#1a2226] space-y-1">
        <button
          onClick={onOpenDocs}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-[#12181b] transition-colors cursor-pointer"
        >
          <BookOpen className="w-4 h-4 text-slate-400" />
          <span>Documentation</span>
        </button>

        <button
          onClick={onOpenSupport}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-[#12181b] transition-colors cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 text-slate-400" />
          <span>Support</span>
        </button>
      </div>
    </aside>
  );
};
