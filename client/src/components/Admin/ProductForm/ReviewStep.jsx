import { useTranslation } from "react-i18next";

/**
 * ReviewStep - Final review before submission
 */
export default function ReviewStep({
  form,
  variants,
  existingImages,
  imagePreviews,
  primaryImageIndex,
  minVariantPrice,
  categoryName,
}) {
  const { t } = useTranslation();
  return (
    <div className="wizard-step">
      <div className="step-header">
        <h3>{t("admin.products.wizard.review.title")}</h3>
        <p className="step-description">{t("admin.products.wizard.review.description")}</p>
      </div>

      <div className="review-grid">
        <div className="review-section">
          <h4>{t("admin.products.wizard.review.infoSection")}</h4>
          <dl className="review-list">
            <div className="review-item">
              <dt>{t("admin.products.wizard.review.labels.name")}</dt>
              <dd>{form.name || '—'}</dd>
            </div>
            <div className="review-item">
              <dt>{t("admin.products.wizard.review.labels.category")}</dt>
              <dd>{categoryName(Number(form.category_id)) || '—'}</dd>
            </div>
            <div className="review-item">
              <dt>{t("admin.products.wizard.review.labels.status")}</dt>
              <dd>
                <span className={`status-badge status-${form.status}`}>
                  {form.status === 'active' ? t("admin.products.wizard.info.statusActive") : form.status === 'draft' ? t("admin.products.wizard.info.statusDraft") : t("admin.products.wizard.info.statusArchived")}
                </span>
              </dd>
            </div>
            {form.pattern_type && (
              <div className="review-item">
                <dt>{t("admin.products.wizard.review.labels.patternType")}</dt>
                <dd>{form.pattern_type === 'rechtsmuster' ? 'Rechtsmuster' : 'Gänsefüsschen'}</dd>
              </div>
            )}
            {form.description && (
              <div className="review-item review-item--full">
                <dt>{t("admin.products.wizard.review.labels.description")}</dt>
                <dd>{form.description}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="review-section">
          <h4>{t("admin.products.wizard.review.variantsSection", { count: variants.filter(v => v.size).length })}</h4>
          <div className="review-variants">
            {variants.filter(v => v.size).slice(0, 6).map((v, i) => (
              <div key={i} className="review-variant">
                <span>{v.size}</span>
                <span>{Number(v.price).toFixed(2)}€</span>
                <span className="stock">{t("admin.products.wizard.variants.stockLabel")}: {v.stock}</span>
              </div>
            ))}
            {variants.filter(v => v.size).length > 6 && (
              <span className="muted">{t("admin.products.wizard.review.moreVariants", { count: variants.filter(v => v.size).length - 6 })}</span>
            )}
          </div>
          {minVariantPrice != null && (
            <p className="price-highlight">{t("admin.products.wizard.review.displayPrice")}: <strong>{minVariantPrice.toFixed(2)}€</strong></p>
          )}
        </div>

        <div className="review-section">
          <h4>{t("admin.products.wizard.review.imagesSection", { count: existingImages.length + imagePreviews.length })}</h4>
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
                <span className="muted">{t("admin.products.wizard.review.moreImages", { count: existingImages.length + imagePreviews.length - 4 })}</span>
              )}
            </div>
          ) : (
            <span className="muted">{t("admin.products.wizard.review.noImage")}</span>
          )}
        </div>
      </div>
    </div>
  );
}
