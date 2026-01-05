import { useMemo, useCallback } from "react";
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
        <h3>Images du produit</h3>
        <p className="step-description">
          Ajoutez des photos de votre produit. Glissez-déposez pour réordonner. Cliquez sur une
          image pour la définir comme principale.
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
          <p>Glissez-déposez vos images ici</p>
          <span className="upload-or">ou</span>
          <label className="btn btn-outline" htmlFor="file-input-wizard">
            Parcourir
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
            Toutes les images ({totalImages})
            {existingImages.length > 0 && imagePreviews.length > 0 && (
              <span className="image-count-detail">
                {" "}
                - {existingImages.length} existante{existingImages.length > 1 ? "s" : ""},{" "}
                {imagePreviews.length} nouvelle{imagePreviews.length > 1 ? "s" : ""}
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
          Les images sont optionnelles mais recommandées pour une meilleure conversion.
        </p>
      )}

      {totalImages > 0 && (
        <p className="hint">
          Glissez les images pour les réordonner. La première image sera l'image principale. Total:{" "}
          {totalImages} image{totalImages > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
