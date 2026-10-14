import { createClient, User as SupabaseUser } from "@supabase/supabase-js";
import { SavedCircuitProject, UserProfile, ParsedBlueprint } from "../types";

const env = (import.meta as any).env || {};
const supabaseUrl =
  env.VITE_SUPABASE_URL || "https://zcatrblncxstjihzggsn.supabase.co";
const supabaseAnonKey =
  env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_hRhn-pM696oHevk0sRb1UQ_qm9OR297";

export function getAppUrl(): string {
  const clientAppUrl = (import.meta as any).env?.VITE_APP_URL;
  if (clientAppUrl && typeof clientAppUrl === "string" && clientAppUrl.trim().length > 0) {
    return clientAppUrl.trim().replace(/\/+$/, "");
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "";
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export interface AppUser {
  uid: string;
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous?: boolean;
}

export function mapSupabaseUser(user: SupabaseUser): AppUser {
  return {
    uid: user.id,
    id: user.id,
    email: user.email || null,
    displayName:
      user.user_metadata?.display_name ||
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "Circuit Engineer",
    photoURL: user.user_metadata?.avatar_url || null,
    isAnonymous: user.is_anonymous || false,
  };
}

let lastDispatchedUserId: string | null | undefined = undefined;

export function onAuthStateChanged(callback: (user: AppUser | null) => void) {
  // onAuthStateChange fires immediately on subscription with INITIAL_SESSION
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    const user = session?.user ? mapSupabaseUser(session.user) : null;
    const currentId = user?.uid || null;

    // Deduplicate identical sequential auth notifications to prevent duplicate DB calls
    if (lastDispatchedUserId !== currentId || event === "USER_UPDATED") {
      lastDispatchedUserId = currentId;
      callback(user);
    }
  });

  return () => {
    subscription.unsubscribe();
  };
}

export async function syncUserProfile(
  user: SupabaseUser | AppUser,
  customDisplayName?: string
): Promise<void> {
  try {
    const userId = "uid" in user ? user.uid : user.id;
    const name =
      customDisplayName ||
      ("displayName" in user
        ? user.displayName
        : user.user_metadata?.display_name) ||
      "Circuit Engineer";
    const email = user.email || "";
    const photoURL =
      ("photoURL" in user
        ? user.photoURL
        : user.user_metadata?.avatar_url) || "";

    // Try upserting to Supabase profiles table
    const { error } = await supabase.from("profiles").upsert(
      {
        id: userId,
        email,
        display_name: name,
        photo_url: photoURL,
        subscription_tier: "free",
        subscription_status: "active",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (error) {
      // Graceful fallback: sync into Supabase auth user_metadata so profile is never lost
      try {
        await supabase.auth.updateUser({
          data: {
            display_name: name,
            avatar_url: photoURL,
          },
        });
      } catch {}
    }
  } catch (err) {
    console.warn("User profile sync fallback active:", err);
  }
}

export async function getUserProfileFromSupabase(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!error && data) {
      return {
        userId: data.id,
        email: data.email,
        displayName: data.display_name,
        photoURL: data.photo_url,
        subscriptionTier: data.subscription_tier || "free",
        subscriptionStatus: data.subscription_status || "active",
        subscriptionExpiresAt: data.subscription_expires_at || null,
        createdAt: data.created_at,
        lastLoginAt: data.updated_at,
      };
    }

    // Fallback: Read from Supabase active session user_metadata and cached tier
    const { data: { session } } = await supabase.auth.getSession();
    const currentUser = session?.user;
    if (currentUser && currentUser.id === userId) {
      const meta = currentUser.user_metadata || {};
      const cachedTier = (localStorage.getItem(`circuito_tier_${userId}`) as any) || meta.subscription_tier || "free";
      const cachedExpires = Number(localStorage.getItem(`circuito_tier_exp_${userId}`)) || meta.subscription_expires_at || null;
      return {
        userId: currentUser.id,
        email: currentUser.email || null,
        displayName: meta.display_name || meta.full_name || currentUser.email?.split("@")[0] || "Circuit Engineer",
        photoURL: meta.avatar_url || null,
        subscriptionTier: cachedTier,
        subscriptionStatus: meta.subscription_status || "active",
        subscriptionExpiresAt: cachedExpires,
        createdAt: currentUser.created_at,
        lastLoginAt: currentUser.last_sign_in_at || new Date().toISOString(),
      };
    }

    return null;
  } catch (err) {
    console.warn("Failed to fetch user profile, using active session:", err);
    return null;
  }
}

export async function updateUserSubscriptionInSupabase(
  userId: string,
  tier: "free" | "student" | "pro",
  status: "active" | "inactive" | "expired" | "pending" = "active",
  expiresAt: number | null = null
): Promise<void> {
  try {
    // Cache locally for immediate fast response across refreshes
    try {
      localStorage.setItem(`circuito_tier_${userId}`, tier);
      if (expiresAt) {
        localStorage.setItem(`circuito_tier_exp_${userId}`, String(expiresAt));
      }
    } catch {}

    // Update in user_metadata as primary or fallback
    try {
      await supabase.auth.updateUser({
        data: {
          subscription_tier: tier,
          subscription_status: status,
          subscription_expires_at: expiresAt,
        },
      });
    } catch {}

    // Also persist in profiles table if created
    await supabase.from("profiles").upsert({
      id: userId,
      subscription_tier: tier,
      subscription_status: status,
      subscription_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("Profiles table update skipped (metadata fallback active):", err);
  }
}

export async function signInWithGoogle(_rememberMe?: boolean): Promise<AppUser | null> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: getAppUrl(),
    },
  });
  if (error) throw error;
  const { data: { user } } = await supabase.auth.getUser();
  return user ? mapSupabaseUser(user) : null;
}

export async function signInWithFacebook(_rememberMe?: boolean): Promise<AppUser | null> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "facebook",
    options: {
      redirectTo: getAppUrl(),
    },
  });
  if (error) throw error;
  const { data: { user } } = await supabase.auth.getUser();
  return user ? mapSupabaseUser(user) : null;
}

export async function signInWithEmail(email: string, pass: string, _rememberMe?: boolean): Promise<AppUser> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: pass,
  });
  if (error) throw error;
  if (!data.user) throw new Error("No user returned from Supabase sign in");

  const mappedUser = mapSupabaseUser(data.user);
  await syncUserProfile(mappedUser);
  return mappedUser;
}

export async function signUpWithEmail(
  email: string,
  pass: string,
  displayName?: string,
  _rememberMe?: boolean
): Promise<AppUser> {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password: pass,
    options: {
      emailRedirectTo: getAppUrl(),
      data: {
        display_name: displayName || email.split("@")[0],
      },
    },
  });
  if (error) throw error;
  if (!data.user) throw new Error("No user returned from Supabase sign up");

  const mappedUser = mapSupabaseUser(data.user);
  if (displayName) mappedUser.displayName = displayName;
  await syncUserProfile(mappedUser, displayName);
  return mappedUser;
}

export async function resetPassword(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${getAppUrl()}/reset-password`,
  });
  if (error) throw error;
}

export async function signInAsGuest(): Promise<AppUser> {
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  if (!data.user) throw new Error("Anonymous sign in disabled or failed");

  const mappedUser = mapSupabaseUser(data.user);
  mappedUser.displayName = "Guest Engineer";
  await syncUserProfile(mappedUser, "Guest Engineer");
  return mappedUser;
}

export async function logOutUser(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function saveProjectToSupabase(
  userId: string,
  projectData: {
    id?: string;
    title: string;
    description?: string;
    targetBoard: string;
    systemArchitecture?: string;
    parsedBlueprint?: ParsedBlueprint | null;
    firmwareCode?: string;
    starred?: boolean;
  }
): Promise<string> {
  const projectId =
    projectData.id || `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const cleanTitle = (projectData.title || "Untitled Circuit Project").trim().substring(0, 200);
  const cleanDescription = (projectData.description || "").trim().substring(0, 2000);
  const cleanTargetBoard = (projectData.targetBoard || "ESP32 (WROOM-32)").substring(0, 64);
  const cleanArch = (
    projectData.systemArchitecture ||
    projectData.parsedBlueprint?.executiveSummary ||
    ""
  ).substring(0, 4000);

  const cleanBOM = projectData.parsedBlueprint?.bomItems
    ? JSON.stringify(projectData.parsedBlueprint.bomItems)
    : "";
  const cleanPinout = projectData.parsedBlueprint?.pinoutRows
    ? JSON.stringify(projectData.parsedBlueprint.pinoutRows)
    : "";
  const cleanCode =
    projectData.firmwareCode ||
    projectData.parsedBlueprint?.codeBlock?.code ||
    "";
  const cleanChecklist = projectData.parsedBlueprint?.testingSteps
    ? JSON.stringify(projectData.parsedBlueprint.testingSteps)
    : "";

  const payload = {
    id: projectId,
    user_id: userId,
    title: cleanTitle,
    description: cleanDescription,
    target_board: cleanTargetBoard,
    system_architecture: cleanArch,
    components_json: cleanBOM,
    pin_mappings_json: cleanPinout,
    firmware_code: cleanCode,
    verification_checklist_json: cleanChecklist,
    starred: projectData.starred ?? false,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("user_projects").upsert(payload);
  if (error) {
    console.error("Failed to save project to Supabase:", error);
    throw new Error(error.message);
  }

  return projectId;
}

export function subscribeToUserProjects(
  userId: string,
  onData: (projects: SavedCircuitProject[]) => void,
  onError?: (error: Error) => void
) {
  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("user_projects")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      const projects: SavedCircuitProject[] = (data || []).map((row) => ({
        id: row.id,
        ownerId: row.user_id,
        title: row.title,
        description: row.description,
        targetBoard: row.target_board,
        systemArchitecture: row.system_architecture,
        componentsJson: row.components_json,
        pinMappingsJson: row.pin_mappings_json,
        firmwareCode: row.firmware_code,
        verificationChecklistJson: row.verification_checklist_json,
        starred: row.starred,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      onData(projects);
    } catch (err: any) {
      if (onError) onError(err);
    }
  };

  fetchProjects();

  const channel = supabase
    .channel(`public:user_projects:user_id=eq.${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "user_projects",
        filter: `user_id=eq.${userId}`,
      },
      () => {
        fetchProjects();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function deleteProjectFromSupabase(userId: string, projectId: string): Promise<void> {
  const { error } = await supabase
    .from("user_projects")
    .delete()
    .eq("id", projectId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}

export async function toggleProjectStar(
  userId: string,
  projectId: string,
  currentStarred: boolean
): Promise<void> {
  const { error } = await supabase
    .from("user_projects")
    .update({ starred: !currentStarred, updated_at: new Date().toISOString() })
    .eq("id", projectId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}

/**
 * Upload a file/asset to Supabase Storage bucket ('circuit-assets')
 */
export async function uploadProjectAsset(
  userId: string,
  fileName: string,
  file: File | Blob
): Promise<{ path: string; publicUrl: string }> {
  const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `${userId}/${Date.now()}_${cleanName}`;

  const { error } = await supabase.storage
    .from("circuit-assets")
    .upload(filePath, file, {
      upsert: true,
      cacheControl: "3600",
    });

  if (error) {
    console.error("Supabase Storage upload error:", error);
    throw new Error(error.message);
  }

  const { data } = supabase.storage
    .from("circuit-assets")
    .getPublicUrl(filePath);

  return {
    path: filePath,
    publicUrl: data.publicUrl,
  };
}

/**
 * Get public URL for a stored project asset
 */
export function getProjectAssetPublicUrl(path: string): string {
  const { data } = supabase.storage.from("circuit-assets").getPublicUrl(path);
  return data.publicUrl;
}

