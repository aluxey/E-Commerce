import { PRESET_SIZES } from '@/hooks/useProductForm';
import { useTranslation } from 'react-i18next';

/**
 * VariantsStep - Variant management step
 */
export default function VariantsStep({
  variants,
  selectedSizes,
  basePrice,
  baseStock,
  minVariantPrice,
  toggleSize,
  setBasePrice,
  setBaseStock,
  generateVariants,
  addVariantRow,
  updateVariantField,
  removeVariantRow,
  setIsDirty,
}) {
  const { t } = useTranslation();

  return (
    <div className="wizard-step">
      <div className="step-header">
        <h3>{t('admin.products.wizard.variants.title')}</h3>
        <p className="step-description">{t('admin.products.wizard.variants.description')}</p>
      </div>

      {/* Génération automatique */}
      <div className="variant-generator">
        <div className="generator-header">
          <h4>{t('admin.products.wizard.variants.quickGenTitle')}</h4>
          <p>{t('admin.products.wizard.variants.quickGenDesc')}</p>
        </div>

        <div className="generator-controls">
          <div className="size-selector">
            <label>{t('admin.products.wizard.variants.sizesLabel')}</label>
            <div className="size-chips">
              {PRESET_SIZES.map(size => (
                <button
                  key={size}
                  type="button"
                  className={`size-chip ${selectedSizes.includes(size) ? 'is-selected' : ''}`}
                  onClick={() => toggleSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="price-stock-row">
            <div className="form-group">
              <label>{t('admin.products.wizard.variants.basePriceLabel')}</label>
              <input
                type="number"
                step="0.01"
                value={basePrice}
                onChange={e => { setBasePrice(e.target.value); setIsDirty(true); }}
                placeholder={t('admin.products.wizard.variants.pricePlaceholder')}
              />
            </div>
            <div className="form-group">
              <label>{t('admin.products.wizard.variants.baseStockLabel')}</label>
              <input
                type="number"
                min={0}
                value={baseStock}
                onChange={e => { setBaseStock(parseInt(e.target.value) || 0); setIsDirty(true); }}
                placeholder={t('admin.products.wizard.variants.stockPlaceholder')}
              />
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={generateVariants}
              disabled={!selectedSizes.length}
            >
              {t('admin.products.wizard.variants.generateBtn', { count: selectedSizes.length || 0 })}
            </button>
          </div>
        </div>
      </div>

      {/* Liste des variantes */}
      <div className="variants-list-section">
        <div className="section-header">
          <h4>{t('admin.products.wizard.variants.sectionTitle', { count: variants.filter(v => v.size).length })}</h4>
          <button type="button" onClick={addVariantRow} className="btn btn-outline btn-sm">
            {t('admin.products.wizard.variants.addManually')}
          </button>
        </div>

        {variants.length > 0 && variants.some(v => v.size) ? (
          <div className="variants-cards">
            {variants.map((variant, index) => (
              <div key={variant.id ?? `new-${index}`} className="variant-card">
                <div className="variant-card__header">
                  <span className="variant-number">#{index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeVariantRow(index)}
                    className="btn-icon btn-remove"
                    aria-label={t('admin.common.delete')}
                  >
                    ×
                  </button>
                </div>

                <div className="variant-card__fields">
                  <div className="field-row">
                    <div className="form-group">
                      <label>{t('admin.products.wizard.variants.sizeLabel')}</label>
                      <input
                        value={variant.size}
                        onChange={e => updateVariantField(index, 'size', e.target.value)}
                        placeholder={t('admin.products.wizard.variants.sizePlaceholder')}
                        required
                      />
                    </div>
                  </div>

                  <div className="field-row">
                    <div className="form-group">
                      <label>{t('admin.products.wizard.variants.priceLabel')}</label>
                      <input
                        type="number"
                        step="0.01"
                        value={variant.price}
                        onChange={e => updateVariantField(index, 'price', e.target.value)}
                        placeholder={t('admin.products.wizard.variants.pricePlaceholder')}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>{t('admin.products.wizard.variants.stockLabel')}</label>
                      <input
                        type="number"
                        min={0}
                        value={variant.stock}
                        onChange={e => updateVariantField(index, 'stock', e.target.value)}
                        placeholder={t('admin.products.wizard.variants.stockPlaceholder')}
                      />
                    </div>
                  </div>

                  {variant.sku && (
                    <div className="variant-sku">
                      <span className="sku-label">SKU:</span>
                      <code>{variant.sku}</code>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state-inline">
            <p>{t('admin.products.wizard.variants.noVariants')}</p>
          </div>
        )}
      </div>

      {minVariantPrice != null && (
        <div className="price-summary">
          <span>{t('admin.products.wizard.variants.minPrice')}:</span>
          <strong>{minVariantPrice.toFixed(2)} €</strong>
        </div>
      )}
    </div>
  );
}
