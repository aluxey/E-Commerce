/**
 * ReviewStep - Final review before submission
 */
export default function ReviewStep({
  form,
  selectedColors,
  variants,
  existingImages,
  imagePreviews,
  primaryImageIndex,
  minVariantPrice,
  categoryName,
  colorById,
}) {
  return (
    <div className="wizard-step">
      <div className="step-header">
        <h3>Résumé</h3>
        <p className="step-description">Vérifiez les informations avant de créer le produit.</p>
      </div>

      <div className="review-grid">
        <div className="review-section">
          <h4>Informations</h4>
          <dl className="review-list">
            <div className="review-item">
              <dt>Nom</dt>
              <dd>{form.name || '—'}</dd>
            </div>
            <div className="review-item">
              <dt>Catégorie</dt>
              <dd>{categoryName(Number(form.category_id)) || '—'}</dd>
            </div>
            <div className="review-item">
              <dt>Statut</dt>
              <dd>
                <span className={`status-badge status-${form.status}`}>
                  {form.status === 'active' ? 'Actif' : form.status === 'draft' ? 'Brouillon' : 'Archivé'}
                </span>
              </dd>
            </div>
            {form.pattern_type && (
              <div className="review-item">
                <dt>Style de crochet</dt>
                <dd>{form.pattern_type === 'rechtsmuster' ? 'Rechtsmuster' : 'Gänsefüsschen'}</dd>
              </div>
            )}
            {form.description && (
              <div className="review-item review-item--full">
                <dt>Description</dt>
                <dd>{form.description}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="review-section">
          <h4>Couleurs ({selectedColors.length})</h4>
          <div className="review-colors">
            {selectedColors.map(id => {
              const c = colorById(id);
              return c ? (
                <span key={id} className="review-color">
                  <span className="color-dot" style={{ backgroundColor: c.hex_code }} />
                  {c.name}
                </span>
              ) : null;
            })}
            {selectedColors.length === 0 && <span className="muted">Aucune couleur</span>}
          </div>
        </div>

        <div className="review-section">
          <h4>Variantes ({variants.filter(v => v.size).length})</h4>
          <div className="review-variants">
            {variants.filter(v => v.size).slice(0, 6).map((v, i) => (
              <div key={i} className="review-variant">
                <span>{v.size}</span>
                <span>{Number(v.price).toFixed(2)}€</span>
                <span className="stock">Stock: {v.stock}</span>
              </div>
            ))}
            {variants.filter(v => v.size).length > 6 && (
              <span className="muted">+{variants.filter(v => v.size).length - 6} autres</span>
            )}
          </div>
          {minVariantPrice != null && (
            <p className="price-highlight">Prix affiché: <strong>{minVariantPrice.toFixed(2)}€</strong></p>
          )}
        </div>

        <div className="review-section">
          <h4>Images ({existingImages.length + imagePreviews.length})</h4>
          {(existingImages.length > 0 || imagePreviews.length > 0) ? (
            <div className="review-images">
              {existingImages.slice(0, 4).map((img, i) => (
                <div key={`existing-${i}`} className={`review-image-wrapper ${primaryImageIndex === i ? 'is-primary' : ''}`}>
                  <img src={img.image_url} alt={`Image ${i + 1}`} />
                  {primaryImageIndex === i && <span className="primary-indicator">★</span>}
                </div>
              ))}
              {imagePreviews.slice(0, Math.max(0, 4 - existingImages.length)).map((src, i) => {
                const actualIndex = existingImages.length + i;
                return (
                  <div key={`new-${i}`} className={`review-image-wrapper ${primaryImageIndex === actualIndex ? 'is-primary' : ''}`}>
                    <img src={src} alt={`Nouvelle ${i + 1}`} />
                    {primaryImageIndex === actualIndex && <span className="primary-indicator">★</span>}
                  </div>
                );
              })}
              {(existingImages.length + imagePreviews.length) > 4 && (
                <span className="muted">+{existingImages.length + imagePreviews.length - 4}</span>
              )}
            </div>
          ) : (
            <span className="muted">Aucune image</span>
          )}
        </div>
      </div>
    </div>
  );
}
