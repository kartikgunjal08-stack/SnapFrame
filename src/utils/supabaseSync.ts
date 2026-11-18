import { BrandKit, StudioState } from "../types/studio";
import { supabase } from "./supabase";

export interface CloudStudioProject {
  id: string;
  name: string;
  studio_state: StudioState;
  updated_at: string;
}

export async function fetchCloudBrandKit(userId: string): Promise<BrandKit | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("user_brand_kits")
    .select("brand_kit")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data?.brand_kit) return null;
  return data.brand_kit as BrandKit;
}

export async function upsertCloudBrandKit(userId: string, brandKit: BrandKit): Promise<void> {
  if (!supabase) return;
  await supabase.from("user_brand_kits").upsert(
    {
      user_id: userId,
      brand_kit: brandKit,
    },
    { onConflict: "user_id" }
  );
}

export async function listCloudProjects(userId: string): Promise<CloudStudioProject[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("studio_projects")
    .select("id, name, studio_state, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(25);

  if (error || !data) return [];
  return data as CloudStudioProject[];
}

export async function saveCloudProject(
  userId: string,
  name: string,
  studioState: StudioState
): Promise<CloudStudioProject | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("studio_projects")
    .insert({
      user_id: userId,
      name: name.trim() || "Untitled Mockup",
      studio_state: studioState,
    })
    .select("id, name, studio_state, updated_at")
    .single();

  if (error || !data) return null;
  return data as CloudStudioProject;
}

export async function deleteCloudProject(userId: string, projectId: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from("studio_projects")
    .delete()
    .eq("id", projectId)
    .eq("user_id", userId);
  return !error;
}
