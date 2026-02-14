import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Upload, Eye, EyeOff, Trash2, ImagePlus } from "lucide-react";
import { pushToast } from "@/utils/toast";
import { LoadingMessage, ErrorMessage } from "@/components/StatusMessage";
import {
  listAllPhotos,
  uploadPhoto,
  deletePhoto,
  toggleVisibility,
  reorderPhotos,
} from "@/services/adminCustomerPhotos";
import "../../styles/customer-photos.css";

/**
 * Gestionnaire admin des photos clients.
 * Permet l'upload, le reordonnement par drag-and-drop,
 * la bascule de visibilite et la suppression.
 */
export default function CustomerPhotoManager() {
  const { t } = useTranslation();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const fileInputRef = useRef(null);

  // Chargement des photos
  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchErr } = await listAllPhotos();
    if (fetchErr) {
      setError(t("admin.customerPhotos.error.load"));
      pushToast(t("admin.customerPhotos.error.load"), "error");
    } else {
      setPhotos(data);
    }
    setLoading(false);
  }, [t]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  // Upload de fichiers
  const handleFiles = useCallback(
    async (files) => {
      if (!files || files.length === 0) return;

      setUploading(true);
      const currentMax = photos.length > 0
        ? Math.max(...photos.map((p) => p.position))
        : -1;

      let successCount = 0;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) continue;

        const { error: upErr } = await uploadPhoto(file, currentMax + 1 + i);
        if (upErr) {
          pushToast(t("admin.customerPhotos.error.upload"), "error");
        } else {
          successCount++;
        }
      }

      if (successCount > 0) {
        pushToast(t("admin.customerPhotos.success.upload"), "success");
        await fetchPhotos();
      }
      setUploading(false);
    },
    [photos, t, fetchPhotos]
  );

  // Clic sur la zone d'upload
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    handleFiles(e.target.files);
    e.target.value = "";
  };

  // Drop zone
  const handleDropZoneDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDropZoneDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDropZoneDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  // Suppression
  const handleDelete = useCallback(
    async (photo) => {
      if (!confirm(t("admin.customerPhotos.confirmDelete"))) return;

      const { error: delErr } = await deletePhoto(photo.id, photo.image_url);
      if (delErr) {
        pushToast(t("admin.customerPhotos.error.delete"), "error");
      } else {
        pushToast(t("admin.customerPhotos.success.delete"), "success");
        setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      }
    },
    [t]
  );

  // Bascule de visibilite
  const handleToggleVisibility = useCallback(
    async (photo) => {
      const newState = !photo.is_visible;
      const { error: togErr } = await toggleVisibility(photo.id, newState);
      if (togErr) {
        pushToast(t("admin.customerPhotos.error.toggle"), "error");
      } else {
        pushToast(t("admin.customerPhotos.success.visibility"), "success");
        setPhotos((prev) =>
          prev.map((p) => (p.id === photo.id ? { ...p, is_visible: newState } : p))
        );
      }
    },
    [t]
  );

  // Drag-and-drop pour reordonnement
  const handleDragStart = useCallback((e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
    e.currentTarget.classList.add("is-dragging");
  }, []);

  const handleDragEnd = useCallback((e) => {
    e.currentTarget.classList.remove("is-dragging");
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  const handleCardDragOver = useCallback(
    (e, index) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (index !== draggedIndex) {
        setDragOverIndex(index);
      }
    },
    [draggedIndex]
  );

  const handleCardDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback(
    async (e, toIndex) => {
      e.preventDefault();
      setDragOverIndex(null);

      if (draggedIndex === null || draggedIndex === toIndex) {
        setDraggedIndex(null);
        return;
      }

      // Reordonner localement
      const reordered = [...photos];
      const [moved] = reordered.splice(draggedIndex, 1);
      reordered.splice(toIndex, 0, moved);

      // Mettre a jour les positions
      const updates = reordered.map((photo, idx) => ({
        id: photo.id,
        position: idx,
      }));

      setPhotos(reordered);
      setDraggedIndex(null);

      // Persister en base
      const { error: reorderErr } = await reorderPhotos(updates);
      if (reorderErr) {
        pushToast(t("admin.customerPhotos.error.reorder"), "error");
        await fetchPhotos();
      } else {
        pushToast(t("admin.customerPhotos.success.reorder"), "success");
      }
    },
    [draggedIndex, photos, t, fetchPhotos]
  );

  if (loading) return <LoadingMessage />;
  if (error) return <ErrorMessage message={error} onRetry={fetchPhotos} />;

  return (
    <div className="photo-manager">
      {/* Zone d'upload */}
      <div
        className={`photo-manager__upload-zone ${isDragOver ? "is-dragging" : ""}`}
        onClick={handleUploadClick}
        onDragOver={handleDropZoneDragOver}
        onDragLeave={handleDropZoneDragLeave}
        onDrop={handleDropZoneDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleUploadClick();
          }
        }}
      >
        {uploading ? (
          <p>{t("admin.common.loading")}</p>
        ) : (
          <>
            <ImagePlus size={32} />
            <p><strong>{t("admin.customerPhotos.upload")}</strong></p>
            <p>{t("admin.customerPhotos.uploadHint")}</p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </div>

      {/* Hint reordonnement */}
      {photos.length > 1 && (
        <p className="photo-manager__reorder-hint">
          {t("admin.customerPhotos.reorderHint")}
        </p>
      )}

      {/* Grille de photos */}
      {photos.length === 0 ? (
        <div className="photo-wall__empty">
          <Upload size={48} strokeWidth={1} />
          <h3>{t("admin.customerPhotos.empty.title")}</h3>
          <p>{t("admin.customerPhotos.empty.description")}</p>
        </div>
      ) : (
        <div className="photo-manager__grid">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className={`photo-manager__card ${!photo.is_visible ? "is-hidden" : ""} ${index === draggedIndex ? "is-dragging" : ""} ${index === dragOverIndex ? "drag-over" : ""}`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleCardDragOver(e, index)}
              onDragLeave={handleCardDragLeave}
              onDrop={(e) => handleDrop(e, index)}
            >
              {/* Drag handle */}
              <span className="photo-manager__drag-handle" title={t("admin.customerPhotos.reorderHint")}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="9" cy="6" r="1.5" />
                  <circle cx="15" cy="6" r="1.5" />
                  <circle cx="9" cy="12" r="1.5" />
                  <circle cx="15" cy="12" r="1.5" />
                  <circle cx="9" cy="18" r="1.5" />
                  <circle cx="15" cy="18" r="1.5" />
                </svg>
              </span>

              <img
                src={photo.image_url}
                alt={t("admin.customerPhotos.photoAlt", { position: index + 1 })}
                className="photo-manager__card-image"
                loading="lazy"
              />

              <div className="photo-manager__card-actions">
                <span className="photo-manager__card-pos">#{index + 1}</span>
                <div className="photo-manager__card-btns">
                  <button
                    className="btn-icon"
                    onClick={() => handleToggleVisibility(photo)}
                    title={photo.is_visible
                      ? t("admin.customerPhotos.toggleHidden")
                      : t("admin.customerPhotos.toggleVisible")}
                    aria-label={photo.is_visible
                      ? t("admin.customerPhotos.toggleHidden")
                      : t("admin.customerPhotos.toggleVisible")}
                  >
                    {photo.is_visible ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button
                    className="btn-icon btn-icon--danger"
                    onClick={() => handleDelete(photo)}
                    title={t("admin.customerPhotos.delete")}
                    aria-label={t("admin.customerPhotos.delete")}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
