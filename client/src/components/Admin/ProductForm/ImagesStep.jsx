import { useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import DraggableImageGrid from "./DraggableImageGrid";

/**
 * ImagesStep - Image upload and management step with drag-and-drop reordering
 */
export default function ImagesStep({
  existingImages,
  imagePreviews,
  primaryImageIndex,
  isDragging,
  onDrop,
  onDragOver,
  onDragLeave,
  onFilesSelected,
  removeExistingImage,
  removeNewImage,
  setAsPrimary,
  reorderImages,
}) {
  const { t } = useTranslation();

  // Build unified image array for the draggable grid
  const unifiedImages = useMemo(() => {
    const unified = [];

    // Add existing images
    existingImages.forEach((img, idx) => {
      unified.push({
        id: img.id,
        src: img.image_url,
        type: "existing",
        originalIndex: idx,
      });
    });

    // Add new images (previews)
    imagePreviews.forEach((previewSrc, idx) => {
      unified.push({
        id: `new-${idx}`,
        src: previewSrc,
        type: "new",
        originalIndex: idx,
      });
    });

    return unified;
  }, [existingImages, imagePreviews]);

  // Handle removal - delegate to appropriate handler based on type
  const handleRemove = useCallback(
    unifiedIndex => {
      const image = unifiedImages[unifiedIndex];
      if (!image) return;

      if (image.type === "existing") {
        removeExistingImage(image.originalIndex);
      } else {
        removeNewImage(image.originalIndex);
      }
    },
    [unifiedImages, removeExistingImage, removeNewImage]
  );

  // Handle set as primary - uses unified index directly
  const handleSetPrimary = useCallback(
    unifiedIndex => {
      const image = unifiedImages[unifiedIndex];
      if (!image) return;

      if (image.type === "existing") {
        setAsPrimary("existing", image.originalIndex);
      } else {
        setAsPrimary("new", image.originalIndex);
      }
    },
    [unifiedImages, setAsPrimary]
  );

  // Handle reorder via drag-and-drop
  const handleReorder = useCallback(
    (fromIndex, toIndex) => {
      if (reorderImages) {
        reorderImages(fromIndex, toIndex);
      }
    },
    [reorderImages]
  );

  const totalImages = unifiedImages.length;

  return (
    <div className="wizard-step">
      <div className="step-header">
        <h3>{t("admin.products.wizard.images.title")}</h3>
        <p className="step-description">
          {t("admin.products.wizard.images.description")}
        </p>
      </div>

      {/* Upload zone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`upload-zone ${isDragging ? "is-dragging" : ""}`}
      >
        <div className="upload-zone__content">
          <span className="upload-icon">📁</span>
          <p>{t("admin.products.wizard.images.dropzone")}</p>
          <span className="upload-or">{t("admin.products.wizard.images.or")}</span>
          <label className="btn btn-outline" htmlFor="file-input-wizard">
            {t("admin.products.wizard.images.browse")}
          </label>
          <input
            id="file-input-wizard"
            type="file"
            accept="image/*"
            multiple
            onChange={e => onFilesSelected(e.target.files)}
            style={{ display: "none" }}
          />
        </div>
      </div>

      {/* Unified draggable image grid */}
      {totalImages > 0 && (
        <div className="images-section">
          <h4>
            {t("admin.products.wizard.images.allImages", { count: totalImages })}
            {existingImages.length > 0 && imagePreviews.length > 0 && (
              <span className="image-count-detail">
                {" - "}
                {t("admin.products.wizard.images.existingCount", { count: existingImages.length })}
                {", "}
                {t("admin.products.wizard.images.newCount", { count: imagePreviews.length })}
              </span>
            )}
          </h4>
          <DraggableImageGrid
            images={unifiedImages}
            onReorder={handleReorder}
            onRemove={handleRemove}
            onSetPrimary={handleSetPrimary}
            primaryIndex={primaryImageIndex}
          />
        </div>
      )}

      {totalImages === 0 && (
        <p className="hint">
          {t("admin.products.wizard.images.hint")}
        </p>
      )}

      {totalImages > 0 && (
        <p className="hint">
          {t("admin.products.wizard.images.reorderHint", { count: totalImages })}
        </p>
      )}
    </div>
  );
}
