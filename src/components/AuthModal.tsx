import React, { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  X,
  LogOut,
  Cloud,
  Trash2,
  FolderOpen,
  Plus,
  AlertCircle,
} from "lucide-react";
import { BrandKit, StudioState } from "../types/studio";
import { UserProfile } from "../hooks/useAuth";
import {
  CloudStudioProject,
  deleteCloudProject,
  listCloudProjects,
  saveCloudBrandKit,
  saveCloudProject,
} from "../utils/supabaseSync";

interface AuthModalProps {
  open: boolean;
  isConfigured: boolean;
  user: User | null;
  profile: UserProfile | null;
  currentStudioState: StudioState;
  brandKit: BrandKit;
  onClose: () => void;
  onSignOut: () => Promise<void>;
  onOpenAuthGate: () => void;
  onLoadStudioSnapshot: (studioState: StudioState, name: string) => void;
  onNotify: (text: string, type?: "info" | "error") => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  open,
  isConfigured,
  user,
  profile,
  currentStudioState,
  brandKit,
  onClose,
  onSignOut,
  onOpenAuthGate,
  onLoadStudioSnapshot,
  onNotify,
}) => {
  const [projects, setProjects] = useState<CloudStudioProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [savingProject, setSavingProject] = useState(false);
  const [syncingBrand, setSyncingBrand] = useState(false);

  const isRedeemed = Boolean(profile?.is_redeemed);

  const refreshProjects = useCallback(async () => {
    if (!user || !isRedeemed) return;
    setLoadingProjects(true);
    try {
      const list = await listCloudProjects(user.id);
      setProjects(list);
    } catch {
      // Non-fatal if table hasn't been created yet
    } finally {
      setLoadingProjects(false);
    }
  }, [isRedeemed, user]);

  useEffect(() => {
    if (open && user && isRedeemed) {
      refreshProjects();
    }
  }, [open, user, isRedeemed, refreshProjects]);

  if (!open) return null;

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProject(true);
    try {
      const created = await saveCloudProject(
        user.id,
        projectName || currentStudioState.captionTitle || "Studio Mockup",
        currentStudioState
      );
      if (created) {
        setProjects((prev) => [created, ...prev]);
        setProjectName("");
        onNotify(`Saved "${created.name}" to your cloud library`);
      }
    } catch (err) {
      onNotify(
        err instanceof Error ? err.message : "Run supabase/schema.sql first to save projects.",
        "error"
      );
    } finally {
      setSavingProject(false);
    }
  };

  const handleSyncBrandKitNow = async () => {
    if (!user) return;
    setSyncingBrand(true);
    try {
      await saveCloudBrandKit(user.id, brandKit);
      onNotify(`Synced "${brandKit.brandName}" Brand Kit to cloud`);
    } catch (err) {
      onNotify(
        err instanceof Error ? err.message : "Run supabase/schema.sql first to sync Brand Kit.",
        "error"
      );
    } finally {
      setSyncingBrand(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!user) return;
    try {
      await deleteCloudProject(user.id, projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      onNotify("Removed saved mockup");
    } catch {
      onNotify("Failed to delete cloud mockup.", "error");
    }
  };

  const displayName =
    profile?.full_name || user?.email?.split("@")[0] || "Member";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-[#111116] border border-[#262632] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-[#1E1E26] flex items-center justify-between">
          <div>
            <h2 className="font-display text-sm font-bold text-white">
              Account & Cloud Sync
            </h2>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {user
                ? "Manage your redeemed license, Brand Kit sync & saved scenes."
                : "Local preview mode · Configure Supabase to enable login."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/[0.06] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[78vh] overflow-y-auto studio-scroll">
          {!user ? (
            <div className="space-y-3">
              {!isConfigured && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 flex items-start gap-2 leading-relaxed">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    Set <code className="font-mono-tabular">VITE_SUPABASE_URL</code> and{" "}
                    <code className="font-mono-tabular">VITE_SUPABASE_ANON_KEY</code> and run{" "}
                    <code className="font-mono-tabular">supabase/schema.sql</code> to enforce SaaS
                    Email + Password + Redeem Code auth.
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuthGate();
                }}
                className="w-full py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-xs font-semibold text-white cursor-pointer"
              >
                Open Auth / Redeem Screen
              </button>
            </div>
          ) : (
            <>
              <div className="p-3.5 rounded-xl bg-[#15151C] border border-[#252532] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {displayName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-white truncate">
                        {user.email}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-[9px] font-mono-tabular font-semibold uppercase text-emerald-300 shrink-0">
                        {profile?.plan || "lifetime"}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono-tabular text-zinc-400 truncate mt-0.5">
                      Code: {profile?.redeemed_code || "Active"}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await onSignOut();
                    onClose();
                    onNotify("Signed out");
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#1D1D26] hover:bg-red-500/15 border border-[#2B2B38] hover:border-red-500/40 text-[11px] font-medium text-zinc-300 hover:text-red-200 transition-colors shrink-0 cursor-pointer"
                >
                  <LogOut className="w-3 h-3" />
                  Sign out
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-[#14141A] border border-[#23232E] flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-100">
                    <Cloud className="w-3.5 h-3.5 text-[#60A5FA]" />
                    <span>Brand Kit Cloud Sync</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                    Active: {brandKit.brandName} ({brandKit.primaryColor})
                  </p>
                </div>
                <button
                  type="button"
                  disabled={syncingBrand}
                  onClick={handleSyncBrandKitNow}
                  className="px-3 py-1.5 rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] text-[11px] font-semibold text-white disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {syncingBrand ? "Syncing..." : "Sync Now"}
                </button>
              </div>

              <div className="space-y-2.5">
                <h3 className="text-xs font-semibold text-zinc-200">Saved Cloud Mockups</h3>
                <form onSubmit={handleSaveProject} className="flex gap-2">
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Scene name (e.g. Launch Hero 4:5)..."
                    className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-[#16161C] border border-[#262632] text-xs text-white focus:outline-none focus:border-[#3B82F6]"
                  />
                  <button
                    type="submit"
                    disabled={savingProject}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[#F4F4F6] hover:bg-white text-xs font-semibold text-[#0A0A0C] disabled:opacity-50 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {savingProject ? "Saving" : "Save"}
                  </button>
                </form>

                {loadingProjects ? (
                  <p className="text-[11px] text-zinc-500 py-3 text-center">
                    Loading cloud projects...
                  </p>
                ) : projects.length === 0 ? (
                  <p className="text-[11px] text-zinc-500 py-3 text-center border border-dashed border-[#24242E] rounded-lg">
                    No cloud scenes saved yet. Save your current canvas above.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {projects.map((proj) => (
                      <div
                        key={proj.id}
                        className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[#14141A] border border-[#23232D]"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-zinc-100 truncate">
                            {proj.name}
                          </div>
                          <div className="text-[10px] font-mono-tabular text-zinc-500">
                            {proj.studio_state.aspectRatio} · {proj.studio_state.frame}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              onLoadStudioSnapshot(proj.studio_state, proj.name);
                              onClose();
                            }}
                            className="flex items-center gap-1 px-2 py-1 rounded bg-[#2563EB]/20 hover:bg-[#2563EB]/30 border border-[#3B82F6]/40 text-[11px] font-medium text-[#93C5FD] cursor-pointer"
                          >
                            <FolderOpen className="w-3 h-3" />
                            Load
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProject(proj.id)}
                            className="p-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
                            title="Delete saved mockup"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
