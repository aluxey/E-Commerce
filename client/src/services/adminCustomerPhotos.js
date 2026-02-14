import { supabase } from "../supabase/supabaseClient";

const TABLE = "customer_photos";
const BUCKET = "product-images";
const STORAGE_FOLDER = "customer-photos";

/**
 * Liste toutes les photos (visibles et masquees), triees par position.
 */
export const listAllPhotos = async () => {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("position", { ascending: true });
  return { data: data || [], error };
};

/**
 * Upload une image dans le storage et cree l'entree en base.
 * @param {File} file - Fichier image
 * @param {number} position - Position dans la grille
 */
export const uploadPhoto = async (file, position = 0) => {
  const ext = file.name.split(".").pop();
  const fileName = `${STORAGE_FOLDER}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

  // Upload vers le storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, file, { cacheControl: "3600", upsert: false });

  if (uploadError) return { data: null, error: uploadError };

  // Recuperer l'URL publique
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
  const imageUrl = urlData.publicUrl;

  // Inserer en base
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ image_url: imageUrl, position })
    .select()
    .single();

  return { data, error };
};

/**
 * Supprime une photo (base + storage).
 * @param {number} id - ID de la photo
 * @param {string} imageUrl - URL de l'image pour supprimer du storage
 */
export const deletePhoto = async (id, imageUrl) => {
  // Extraire le chemin relatif depuis l'URL publique
  const path = imageUrl.split(`${BUCKET}/`).pop();

  if (path) {
    await supabase.storage.from(BUCKET).remove([path]);
  }

  return supabase.from(TABLE).delete().eq("id", id);
};

/**
 * Bascule la visibilite d'une photo.
 * @param {number} id - ID de la photo
 * @param {boolean} isVisible - Nouvel etat de visibilite
 */
export const toggleVisibility = async (id, isVisible) => {
  return supabase
    .from(TABLE)
    .update({ is_visible: isVisible })
    .eq("id", id);
};

/**
 * Met a jour les positions de plusieurs photos (reordonnement).
 * @param {Array<{id: number, position: number}>} updates - Tableau d'updates
 */
export const reorderPhotos = async (updates) => {
  // Mise a jour sequentielle pour eviter les conflits
  const errors = [];
  for (const { id, position } of updates) {
    const { error } = await supabase
      .from(TABLE)
      .update({ position })
      .eq("id", id);
    if (error) errors.push(error);
  }
  return { error: errors.length ? errors[0] : null };
};
