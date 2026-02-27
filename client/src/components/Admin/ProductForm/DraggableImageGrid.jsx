import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";

/**
 * DraggableImageGrid - A drag-and-drop image grid component
 * Uses native HTML5 drag and drop API (no external library needed)
 *
 * Props:
 * - images: Array of { src, id?, type: 'existing' | 'new', originalIndex }
 * - onReorder: (fromIndex, toIndex) => void
 * - onRemove: (unifiedIndex) => void
 * - onSetPrimary: (unifiedIndex) => void
 * - primaryIndex: number (unified index of primary image)
 */
export default function DraggableImageGrid({
  images,
  onReorder,
  onRemove,
  onSetPrimary,
  primaryIndex,
}) {
  const { t } = useTranslation();
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const handleDragStart = useCallback((e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // Set drag image to the current element
    e.dataTransfer.setData("text/plain", index.toString());
    // Add visual feedback
    e.currentTarget.classList.add("is-dragging");
  }, []);

  const handleDragEnd = useCallback(e => {
    e.currentTarget.classList.remove("is-dragging");
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  const handleDragOver = useCallback(
    (e, index) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (index !== draggedIndex) {
        setDragOverIndex(index);
      }
    },
    [draggedIndex]
  );

  const handleDragLeave = useCallback(e => {
    e.preventDefault();
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback(
    (e, toIndex) => {
      e.preventDefault();
      setDragOverIndex(null);

      if (draggedIndex !== null && draggedIndex !== toIndex) {
        onReorder(draggedIndex, toIndex);
      }
      setDraggedIndex(null);
    },
    [draggedIndex, onReorder]
  );

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className="draggable-image-grid">
      {images.map((image, index) => {
        const isPrimary = index === primaryIndex;
        const isDragging = index === draggedIndex;
        const isDragOver = index === dragOverIndex;

        return (
          <div
            key={image.id || `new-${index}`}
            className={`image-card draggable ${isPrimary ? "is-primary" : ""} ${isDragging ? "is-dragging" : ""} ${isDragOver ? "drag-over" : ""}`}
            draggable
            onDragStart={e => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={e => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, index)}
            onClick={() => onSetPrimary(index)}
          >
            <img src={image.src} alt={t("admin.products.wizard.images.imageAlt", { index: index + 1 })} />

            {/* Primary badge */}
            {isPrimary && <span className="image-badge">{t("admin.products.wizard.images.primary")}</span>}

            {/* Type indicator for mixed grids */}
            {image.type === "new" && !isPrimary && (
              <span className="image-badge image-badge--new">{t("admin.products.wizard.images.new")}</span>
            )}

            {/* Drag handle indicator */}
            <span className="drag-handle" title={t("admin.products.wizard.images.dragToReorder")}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="9" cy="6" r="1.5" />
                <circle cx="15" cy="6" r="1.5" />
                <circle cx="9" cy="12" r="1.5" />
                <circle cx="15" cy="12" r="1.5" />
                <circle cx="9" cy="18" r="1.5" />
                <circle cx="15" cy="18" r="1.5" />
              </svg>
            </span>

            {/* Remove button */}
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onRemove(index);
              }}
              className="btn-remove-image"
              aria-label={t("admin.common.delete")}
            >
              &times;
            </button>

            {/* Position indicator */}
            <span className="position-indicator">{index + 1}</span>
          </div>
        );
      })}
    </div>
  );
}
