import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface HomeBanner {
  id: string;
  image_url: string;
  title: string;
  link_caterer_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const HOME_BANNERS_BUCKET = "home-banners";
export const MAX_BANNER_BYTES = 5 * 1024 * 1024;

function errMsg(e: unknown): string {
  if (e instanceof Error && e.message) return e.message;
  if (e && typeof e === "object") {
    const o = e as Record<string, unknown>;
    if (typeof o["message"] === "string" && o["message"])
      return o["message"] as string;
  }
  return "Something went wrong.";
}

export function useHomeBanners() {
  return useQuery({
    queryKey: ["home-banners", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("home_banners")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw new Error(errMsg(error));
      return (data ?? []) as HomeBanner[];
    },
  });
}

export function storagePathFromUrl(url: string): string | null {
  const marker = `/${HOME_BANNERS_BUCKET}/`;
  const i = url.indexOf(marker);
  return i >= 0 ? url.slice(i + marker.length) : null;
}

export function useUploadHomeBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, title }: { file: File; title: string }) => {
      if (!file.type.startsWith("image/"))
        throw new Error("Please choose an image file.");
      if (file.size > MAX_BANNER_BYTES)
        throw new Error("Image is too large — maximum is 5 MB.");
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `banners/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(HOME_BANNERS_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw new Error(errMsg(uploadError));
      const {
        data: { publicUrl },
      } = supabase.storage.from(HOME_BANNERS_BUCKET).getPublicUrl(path);
      const { data: existing } = await supabase
        .from("home_banners")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      const nextOrder = ((existing as { sort_order: number } | null)?.sort_order ?? -1) + 1;
      const { error: rowError } = await supabase.from("home_banners").insert({
        image_url: publicUrl,
        title: title.trim() || "Home banner",
        sort_order: nextOrder,
        is_active: true,
      });
      if (rowError) {
        await supabase.storage.from(HOME_BANNERS_BUCKET).remove([path]);
        throw new Error(errMsg(rowError));
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["home-banners"] }),
  });
}

export function useUpdateHomeBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Pick<HomeBanner, "title" | "is_active" | "sort_order" | "link_caterer_id">>;
    }) => {
      const { error } = await supabase
        .from("home_banners")
        .update(updates)
        .eq("id", id);
      if (error) throw new Error(errMsg(error));
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["home-banners"] }),
  });
}

export function useDeleteHomeBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (banner: HomeBanner) => {
      const { error } = await supabase
        .from("home_banners")
        .delete()
        .eq("id", banner.id);
      if (error) throw new Error(errMsg(error));
      const path = storagePathFromUrl(banner.image_url);
      if (path) {
        await supabase.storage.from(HOME_BANNERS_BUCKET).remove([path]);
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["home-banners"] }),
  });
}
