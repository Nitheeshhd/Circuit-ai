import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Cloud,
  FolderGit2,
  BookmarkPlus,
  Trash2,
  Star,
  Search,
  ExternalLink,
  Cpu,
  Layers,
  Calendar,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  LogIn,
  Save,
  Clock,
  Sparkles,
} from "lucide-react";
import { SavedCircuitProject, ParsedBlueprint, TargetBoard } from "../types";
import {
  saveProjectToSupabase,
  deleteProjectFromSupabase,
  toggleProjectStar,
  signInWithGoogle,
  AppUser as User,
} from "../services/supabase";

interface CloudProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  projects: SavedCircuitProject[];
  isLoadingProjects: boolean;
  currentPrompt: string;
  currentTargetBoard: TargetBoard;
  currentBlueprint: ParsedBlueprint | null;
  onLoadProject: (project: SavedCircuitProject) => void;
  onSaveLocalProject?: (project: SavedCircuitProject) => void;
  onDeleteLocalProject?: (projectId: string) => void;
  onToggleStarLocal?: (projectId: string) => void;
}

export const CloudProjectsModal: React.FC<CloudProjectsModalProps> = ({
  isOpen,
  onClose,
  user,
  projects,
  isLoadingProjects,
  currentPrompt,
  currentTargetBoard,
  currentBlueprint,
  onLoadProject,
  onSaveLocalProject,
  onDeleteLocalProject,
  onToggleStarLocal,
}) => {
  const [activeTab, setActiveTab] = useState<"library" | "save">("library");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBoardFilter, setSelectedBoardFilter] = useState<string>("all");
  const [onlyStarred, setOnlyStarred] = useState(false);

  // Save form states
  const [saveTitle, setSaveTitle] = useState(currentPrompt.slice(0, 80) || "My Circuit Project");
  const [saveDescription, setSaveDescription] = useState(currentPrompt || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Authentication in modal states
  const [isSigningInModal, setIsSigningInModal] = useState(false);
  const [authModalError, setAuthModalError] = useState<string | null>(null);

  // Delete states
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // When modal opens, sync title with current prompt
  React.useEffect(() => {
    if (isOpen && currentPrompt) {
      setSaveTitle(currentPrompt.slice(0, 80));
      setSaveDescription(currentPrompt);
    }
  }, [isOpen, currentPrompt]);

  if (!isOpen) return null;

  const handleSaveCurrent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      // Save locally without requiring sign-in
      const newProj: SavedCircuitProject = {
        id: "local-" + Date.now(),
        ownerId: "guest",
        title: saveTitle || "Circuit Blueprint",
        description: saveDescription,
        targetBoard: currentTargetBoard,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        starred: false,
        componentsJson: JSON.stringify(currentBlueprint?.bomItems || []),
        pinMappingsJson: JSON.stringify(currentBlueprint?.pinoutRows || []),
        firmwareCode: currentBlueprint?.codeBlock?.code || "",
        verificationChecklistJson: JSON.stringify(currentBlueprint?.testingSteps || []),
      };
      if (onSaveLocalProject) {
        onSaveLocalProject(newProj);
      }
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setActiveTab("library");
      }, 1200);
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await saveProjectToSupabase(user.uid, {
        title: saveTitle || "Circuit Blueprint",
        description: saveDescription,
        targetBoard: currentTargetBoard,
        parsedBlueprint: currentBlueprint,
        firmwareCode: currentBlueprint?.codeBlock?.code,
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setActiveTab("library");
      }, 1200);
    } catch (err: any) {
      console.error("Save project error:", err);
      setSaveError(err?.message || "Failed to save project to cloud.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!user) {
      if (onDeleteLocalProject) onDeleteLocalProject(projectId);
      setConfirmDeleteId(null);
      return;
    }
    setDeletingId(projectId);
    try {
      await deleteProjectFromSupabase(user.uid, projectId);
      setConfirmDeleteId(null);
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStar = async (projectId: string, currentStarred: boolean) => {
    if (!user) {
      if (onToggleStarLocal) onToggleStarLocal(projectId);
      return;
    }
    try {
      await toggleProjectStar(user.uid, projectId, currentStarred);
    } catch (err) {
      console.error("Toggle star error:", err);
    }
  };

  // Filter projects
  const filteredProjects = projects.filter((proj) => {
    const matchesSearch =
      proj.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (proj.description && proj.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      proj.targetBoard.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBoard =
      selectedBoardFilter === "all" ||
      proj.targetBoard.toLowerCase().includes(selectedBoardFilter.toLowerCase());
    const matchesStar = !onlyStarred || proj.starred;
    return matchesSearch && matchesBoard && matchesStar;
  });

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Just now";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds ? timestamp.seconds * 1000 : timestamp);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Saved";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 6 }}
        transition={{ duration: 0.15 }}
        className="bg-[#121819] border border-[#202728] rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-[#202728] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#111719]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#073D2D] border border-[#25D366]/30 flex items-center justify-center shrink-0">
              <Cloud className="w-5 h-5 text-[#25D366]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-medium text-[#F1F3F4]">
                  Supabase Cloud Projects
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#073D2D] border border-[#25D366]/30 text-[10px] font-mono text-[#25D366]">
                  Supabase Sync
                </span>
              </div>
              <p className="text-xs text-[#9AA0A2] hidden sm:block">
                Persist, version, and load full hardware schematics, BOMs, and firmware
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between w-full sm:w-auto gap-3">
            {/* Tabs */}
            <div className="flex bg-[#202628] p-1 rounded-full border border-[#202728]">
              <button
                onClick={() => setActiveTab("library")}
                className={`px-3.5 py-1 text-xs font-medium rounded-full transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "library"
                    ? "bg-[#25D366] text-[#071011] shadow-xs"
                    : "text-[#9AA0A2] hover:text-[#F1F3F4]"
                }`}
              >
                <FolderGit2 className="w-3.5 h-3.5" />
                <span>My Library ({projects.length})</span>
              </button>
              <button
                onClick={() => setActiveTab("save")}
                className={`px-3.5 py-1 text-xs font-medium rounded-full transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "save"
                    ? "bg-[#25D366] text-[#071011] shadow-xs"
                    : "text-[#9AA0A2] hover:text-[#F1F3F4]"
                }`}
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span>Save Active Design</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-[#9AA0A2] hover:text-[#F1F3F4] rounded-full hover:bg-[#202628] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#121819]">
          {!user ? (
            /* Unauthenticated Prompt */
            <div className="py-12 flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-[#073D2D] border border-[#25D366]/30 flex items-center justify-center mb-4 text-[#25D366]">
                <Cloud className="w-8 h-8 text-[#25D366]" />
              </div>
              <h3 className="text-lg font-medium text-[#F1F3F4] mb-2">
                Connect with Cloud Workspace
              </h3>
              <p className="text-xs text-[#9AA0A2] mb-6 leading-relaxed">
                Sign in to automatically sync your generated circuit schematics, wiring tables, Bill of Materials, and firmware source code across devices in real-time.
              </p>
              {authModalError && (
                <div className="mb-4 p-3 bg-[#1A1112] border border-[#FF4D4D]/30 text-[#FF8585] rounded-xl text-xs text-left max-w-sm flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#FF4D4D] shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-[11px] text-[#FF4D4D]">Authentication Notice</p>
                    <p className="text-[11px] text-[#FFB3B3] leading-relaxed">{authModalError}</p>
                  </div>
                  <button
                    onClick={() => setAuthModalError(null)}
                    className="text-[#FF8585] hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <button
                disabled={isSigningInModal}
                onClick={async () => {
                  setIsSigningInModal(true);
                  setAuthModalError(null);
                  try {
                    await signInWithGoogle();
                  } catch (err: any) {
                    if (err?.code === "auth/popup-closed-by-user") {
                      console.log("Popup closed by user.");
                    } else if (err?.code === "auth/popup-blocked") {
                      setAuthModalError("Popup was blocked by your browser. Please allow popups for this site.");
                    } else {
                      console.error("Sign-in error:", err);
                      setAuthModalError(err?.message || "Sign-in failed. Please retry.");
                    }
                  } finally {
                    setIsSigningInModal(false);
                  }
                }}
                className="px-6 py-3 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-[#071011] font-medium text-sm flex items-center gap-2 transition-colors cursor-pointer shadow-xs disabled:opacity-70"
              >
                {isSigningInModal ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#071011]" />
                ) : (
                  <LogIn className="w-4 h-4 text-[#071011]" />
                )}
                <span>{isSigningInModal ? "Connecting Google..." : "Sign in with Google"}</span>
              </button>
            </div>
          ) : activeTab === "save" ? (
            /* Save Active Circuit Form */
            <form onSubmit={handleSaveCurrent} className="max-w-2xl mx-auto space-y-4 py-2">
              <div className="bg-[#202628] border border-[#202728] p-4 rounded-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-[#25D366]" />
                  <h4 className="text-xs font-medium uppercase tracking-wider text-[#25D366]">
                    Active Blueprint Snapshot
                  </h4>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-[#111719] p-3 rounded-xl border border-[#202728]">
                    <span className="text-[#6F7779] text-[10px] block">TARGET MICROCONTROLLER</span>
                    <span className="font-mono text-[#F1F3F4] font-medium">{currentTargetBoard}</span>
                  </div>
                  <div className="bg-[#111719] p-3 rounded-xl border border-[#202728]">
                    <span className="text-[#6F7779] text-[10px] block">HARDWARE COMPONENTS</span>
                    <span className="font-mono text-[#25D366] font-medium">
                      {currentBlueprint?.bomItems?.length || 0} Modules / ICs
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#F1F3F4] mb-1.5">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={saveTitle}
                  onChange={(e) => setSaveTitle(e.target.value)}
                  placeholder="e.g. IoT Smart Agriculture Greenhouse Monitor"
                  className="w-full bg-[#202628] border border-[#202728] rounded-2xl px-4 py-2.5 text-xs text-[#F1F3F4] placeholder-[#6F7779] focus:outline-none focus:border-[#25D366]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#F1F3F4] mb-1.5">
                  Project Description & Specifications
                </label>
                <textarea
                  rows={3}
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  placeholder="Detailed functional specifications and component notes..."
                  className="w-full bg-[#202628] border border-[#202728] rounded-2xl px-4 py-2.5 text-xs text-[#F1F3F4] placeholder-[#6F7779] focus:outline-none focus:border-[#25D366] resize-none"
                />
              </div>

              {saveError && (
                <div className="p-3 rounded-2xl bg-[#381617] border border-[#f87171]/30 text-[#f87171] text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}

              {saveSuccess && (
                <div className="p-3 rounded-2xl bg-[#073D2D] border border-[#25D366]/30 text-[#25D366] text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Circuit saved successfully to Cloud!</span>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("library")}
                  className="px-4 py-2 rounded-full text-xs text-[#9AA0A2] hover:text-[#F1F3F4] hover:bg-[#202628] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-[#071011] font-medium text-xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#071011]" />
                  ) : (
                    <Save className="w-3.5 h-3.5 text-[#071011]" />
                  )}
                  <span>{isSaving ? "Saving to Cloud..." : "Save Project"}</span>
                </button>
              </div>
            </form>
          ) : (
            /* Saved Projects Library View */
            <div className="space-y-4">
              {/* Filter and Search Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-[#9AA0A2] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search projects, MCUs, or components..."
                    className="w-full bg-[#202628] border border-[#202728] rounded-full pl-9 pr-4 py-2 text-xs text-[#F1F3F4] placeholder-[#6F7779] focus:outline-none focus:border-[#25D366]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedBoardFilter}
                    onChange={(e) => setSelectedBoardFilter(e.target.value)}
                    className="bg-[#202628] border border-[#202728] text-[#F1F3F4] text-xs rounded-full px-3 py-2 focus:outline-none focus:border-[#25D366] cursor-pointer"
                  >
                    <option value="all">All Microcontrollers</option>
                    <option value="ESP32">ESP32</option>
                    <option value="Arduino">Arduino</option>
                    <option value="STM32">STM32</option>
                    <option value="Pico">RP2040 / Pico</option>
                    <option value="8051">8051</option>
                  </select>

                  <button
                    onClick={() => setOnlyStarred(!onlyStarred)}
                    className={`px-3 py-2 rounded-full text-xs font-medium flex items-center gap-1.5 border transition-colors cursor-pointer ${
                      onlyStarred
                        ? "bg-[#073D2D] text-[#25D366] border-[#25D366]/40"
                        : "bg-[#202628] text-[#9AA0A2] border-[#202728] hover:text-[#F1F3F4]"
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${onlyStarred ? "fill-[#25D366] text-[#25D366]" : ""}`} />
                    <span>Starred</span>
                  </button>
                </div>
              </div>

              {/* Projects Grid */}
              {isLoadingProjects ? (
                <div className="py-16 text-center text-[#9AA0A2]">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#25D366] mb-2" />
                  <p className="text-xs">Synchronizing cloud blueprints...</p>
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-[#202728] rounded-3xl bg-[#111719]/50">
                  <FolderGit2 className="w-10 h-10 text-[#6F7779] mx-auto mb-2" />
                  <h4 className="text-sm font-medium text-[#F1F3F4] mb-1">
                    No Circuit Projects Found
                  </h4>
                  <p className="text-xs text-[#9AA0A2] mb-4 max-w-sm mx-auto">
                    {searchQuery
                      ? "No saved projects match your search criteria."
                      : "Save your active circuit design to access it anywhere."}
                  </p>
                  <button
                    onClick={() => setActiveTab("save")}
                    className="px-4 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-[#071011] rounded-full text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    <span>Save Current Circuit</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredProjects.map((project) => {
                    let bomCount = 0;
                    try {
                      if (project.componentsJson) {
                        const parsed = JSON.parse(project.componentsJson);
                        bomCount = Array.isArray(parsed) ? parsed.length : 0;
                      }
                    } catch {}

                    return (
                      <div
                        key={project.id}
                        className="bg-[#202628] border border-[#202728] hover:border-[#25D366]/40 rounded-2xl p-4 transition-colors flex flex-col justify-between group"
                      >
                        <div>
                          {/* Header row */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="text-sm font-medium text-[#F1F3F4] line-clamp-1 group-hover:text-[#25D366] transition-colors">
                              {project.title}
                            </h3>
                            <button
                              onClick={() => handleToggleStar(project.id, !!project.starred)}
                              className="text-[#6F7779] hover:text-[#25D366] p-1 transition-colors cursor-pointer"
                              title={project.starred ? "Unstar" : "Star"}
                            >
                              <Star
                                className={`w-4 h-4 ${
                                  project.starred
                                    ? "fill-[#25D366] text-[#25D366]"
                                    : "text-[#6F7779] hover:text-[#25D366]"
                                }`}
                              />
                            </button>
                          </div>

                          {/* Description */}
                          {project.description && (
                            <p className="text-xs text-[#9AA0A2] line-clamp-2 mb-3 leading-relaxed">
                              {project.description}
                            </p>
                          )}

                          {/* Metadata Tags */}
                          <div className="flex flex-wrap items-center gap-2 mb-4">
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#111719] text-[#F1F3F4] border border-[#202728]">
                              <Cpu className="w-3 h-3 text-[#9AA0A2]" />
                              <span>{project.targetBoard}</span>
                            </span>

                            {bomCount > 0 && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#073D2D] text-[#25D366] border border-[#25D366]/20">
                                <Layers className="w-3 h-3" />
                                <span>{bomCount} Components</span>
                              </span>
                            )}

                            <span className="inline-flex items-center gap-1 text-[10px] text-[#6F7779] ml-auto">
                              <Clock className="w-3 h-3" />
                              <span>{formatDate(project.updatedAt || project.createdAt)}</span>
                            </span>
                          </div>
                        </div>

                        {/* Action Footer */}
                        <div className="pt-3 border-t border-[#202728] flex items-center justify-between gap-2">
                          {confirmDeleteId === project.id ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-[#f87171]">Delete?</span>
                              <button
                                onClick={() => handleDelete(project.id)}
                                disabled={deletingId === project.id}
                                className="px-2.5 py-1 bg-[#381617] border border-[#f87171]/40 text-[#f87171] text-xs rounded-full font-medium cursor-pointer"
                              >
                                {deletingId === project.id ? "..." : "Confirm"}
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-1 text-[#9AA0A2] text-xs hover:text-[#F1F3F4]"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(project.id)}
                              className="text-[#6F7779] hover:text-[#f87171] p-1.5 rounded-full hover:bg-[#202628] transition-colors cursor-pointer"
                              title="Delete project from cloud"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => {
                              onLoadProject(project);
                              onClose();
                            }}
                            className="px-3.5 py-1.5 rounded-full bg-[#111719] hover:bg-[#25D366] text-[#F1F3F4] hover:text-[#071011] font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-[#202728]"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Load Workspace</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
