import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  LogIn,
  LogOut,
  FolderGit2,
  BookmarkPlus,
  Cloud,
  CheckCircle2,
  Loader2,
  ChevronDown,
  User as UserIcon,
  ShieldCheck,
  AlertCircle,
  X,
} from "lucide-react";
import { signInWithGoogle, logOutUser, AppUser as User } from "../services/supabase";

function formatAuthError(_err: any): string {
  return "Cannot authenticate right now";
}

interface UserAuthButtonProps {
  user: User | null;
  isLoadingAuth: boolean;
  onOpenCloudProjects: () => void;
  onSaveCurrentToCloud: () => void;
  onOpenLogin?: () => void;
  hasActiveBlueprint: boolean;
  savedProjectsCount: number;
}

export const UserAuthButton: React.FC<UserAuthButtonProps> = ({
  user,
  isLoadingAuth,
  onOpenCloudProjects,
  onSaveCurrentToCloud,
  onOpenLogin,
  hasActiveBlueprint,
  savedProjectsCount,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setAuthError(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignIn = () => {
    if (onOpenLogin) {
      onOpenLogin();
    }
  };

  const handleSignOut = async () => {
    try {
      await logOutUser();
      setIsOpen(false);
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="bg-[#111719] border border-[#202728] px-3.5 py-1.5 rounded-full flex items-center gap-2 text-xs text-[#9AA0A2]">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#25D366]" />
        <span className="hidden sm:inline">Connecting Cloud...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative" ref={menuRef}>
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleSignIn}
          disabled={isSigningIn}
          title="Sign in to save circuits and sync projects"
          className="bg-[#25D366] hover:bg-[#20bd5a] text-[#071011] font-bold text-xs px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-colors duration-150 cursor-pointer shadow-xs"
        >
          {isSigningIn ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <LogIn className="w-3.5 h-3.5 text-[#071011]" />
          )}
          <span>{isSigningIn ? "Signing In..." : "Log In"}</span>
        </motion.button>

        <AnimatePresence>
          {authError && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              className="absolute right-0 mt-2 w-72 bg-[#1A1112] border border-[#FF4D4D]/30 text-[#FF8585] rounded-xl p-3 shadow-2xl z-50 text-xs flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-[#FF4D4D] shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#FF4D4D] text-[11px] mb-0.5">Authentication Note</p>
                <p className="text-[11px] text-[#FFB3B3] leading-relaxed break-words">{authError}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setAuthError(null);
                }}
                className="text-[#FF8585] hover:text-[#FFF] p-0.5 rounded cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#111719] hover:bg-[#202628] border border-[#202728] px-3 py-1.5 rounded-full flex items-center gap-2 transition-colors duration-150 text-xs cursor-pointer group"
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || "User"}
            className="w-5 h-5 rounded-full object-cover border border-[#25D366]/40"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-5 h-5 rounded-full bg-[#073D2D] text-[#25D366] flex items-center justify-center font-medium text-[10px]">
            {user.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
          </div>
        )}
        <span className="font-medium text-[#F1F3F4] text-xs hidden sm:inline max-w-[100px] truncate">
          {user.displayName?.split(" ")[0] || "User"}
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-[#25D366]" />
        <ChevronDown
          className={`w-3 h-3 text-[#9AA0A2] transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-72 bg-[#121819] border border-[#202728] rounded-2xl shadow-xl z-50 p-2 divide-y divide-[#202728]"
          >
            {/* User Profile Card */}
            <div className="p-2.5 flex items-center gap-3">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "User"}
                  className="w-10 h-10 rounded-full object-cover border border-[#202728]"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#073D2D] text-[#25D366] flex items-center justify-center font-medium text-sm">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-[#F1F3F4] truncate">
                    {user.displayName || "Circuit Engineer"}
                  </span>
                  <span title="Supabase Verified" className="inline-flex">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                  </span>
                </div>
                <p className="text-[11px] font-mono text-[#9AA0A2] truncate">{user.email}</p>
                <div className="flex items-center gap-1 text-[11px] text-[#25D366] mt-0.5">
                  <Cloud className="w-3 h-3 text-[#25D366]" />
                  <span>Supabase Cloud Connected</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="py-1.5 space-y-1">
              <button
                onClick={() => {
                  onOpenCloudProjects();
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs text-[#F1F3F4] hover:bg-[#202628] hover:text-[#25D366] transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FolderGit2 className="w-4 h-4 text-[#9AA0A2] group-hover:text-[#25D366] transition-colors" />
                  <span className="font-medium">My Cloud Projects</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-[#073D2D] text-[#25D366] border border-[#25D366]/30 rounded-full">
                  {savedProjectsCount}
                </span>
              </button>

              {hasActiveBlueprint && (
                <button
                  onClick={() => {
                    onSaveCurrentToCloud();
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-[#F1F3F4] hover:bg-[#202628] hover:text-[#25D366] transition-colors flex items-center gap-2 group cursor-pointer"
                >
                  <BookmarkPlus className="w-4 h-4 text-[#25D366]" />
                  <span className="font-medium">Save Current Design</span>
                </button>
              )}
            </div>

            {/* Sign Out */}
            <div className="pt-1.5">
              <button
                onClick={handleSignOut}
                className="w-full text-left px-3 py-2 rounded-xl text-xs text-[#9AA0A2] hover:bg-[#202628] hover:text-[#F1F3F4] transition-colors flex items-center gap-2 cursor-pointer font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
