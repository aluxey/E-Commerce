/**
 * ImagesStep - Image upload and management step
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
}) {
  const totalImages = existingImages.length + imagePreviews.length;

  return (
    <div className="wizard-step">
      <div className="step-header">
        <h3>Images du produit</h3>
        <p className="step-description">Ajoutez des photos de votre produit. Cliquez sur une image pour la définir comme principale.</p>
      </div>

      {/* Existing images (when editing) */}
      {existingImages.length > 0 && (
        <div className="existing-images-section">
          <h4>Images existantes ({existingImages.length})</h4>
          <div className="image-grid">
            {existingImages.map((img, idx) => (
              <div
                key={img.id}
                className={`image-card ${primaryImageIndex === idx ? 'is-primary' : ''}`}
                onClick={() => setAsPrimary('existing', idx)}
              >
                <img src={img.image_url} alt={`Image ${idx + 1}`} />
                {primaryImageIndex === idx && <span className="image-badge">Principal</span>}
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); removeExistingImage(idx); }}
                  className="btn-remove-image"
                  aria-label="Supprimer"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload zone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`upload-zone ${isDragging ? 'is-dragging' : ''}`}
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
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {/* New images preview */}
      {imagePreviews.length > 0 && (
        <div className="new-images-section">
          <h4>Nouvelles images ({imagePreviews.length})</h4>
          <div className="image-grid">
            {imagePreviews.map((src, idx) => {
              const actualIndex = existingImages.length + idx;
              return (
                <div
                  key={idx}
                  className={`image-card ${primaryImageIndex === actualIndex ? 'is-primary' : ''}`}
                  onClick={() => setAsPrimary('new', idx)}
                >
                  <img src={src} alt={`Aperçu ${idx + 1}`} />
                  {primaryImageIndex === actualIndex && <span className="image-badge">Principal</span>}
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); removeNewImage(idx); }}
                    className="btn-remove-image"
                    aria-label="Supprimer"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {totalImages === 0 && (
        <p className="hint">Les images sont optionnelles mais recommandées pour une meilleure conversion.</p>
      )}

      {totalImages > 0 && (
        <p className="hint">Cliquez sur une image pour la définir comme image principale. Total: {totalImages} image{totalImages > 1 ? 's' : ''}</p>
      )}
    </div>
  );
}
