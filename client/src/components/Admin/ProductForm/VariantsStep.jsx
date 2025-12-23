import { PRESET_SIZES } from '@/hooks/useProductForm';

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
  return (
    <div className="wizard-step">
      <div className="step-header">
        <h3>Variantes (Tailles & Prix)</h3>
        <p className="step-description">Définissez les déclinaisons de votre produit.</p>
      </div>

      {/* Génération automatique */}
      <div className="variant-generator">
        <div className="generator-header">
          <h4>Génération rapide</h4>
          <p>Sélectionnez les tailles et définissez un prix de base pour générer automatiquement toutes les variantes.</p>
        </div>

        <div className="generator-controls">
          <div className="size-selector">
            <label>Tailles</label>
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
              <label>Prix de base (€)</label>
              <input
                type="number"
                step="0.01"
                value={basePrice}
                onChange={e => { setBasePrice(e.target.value); setIsDirty(true); }}
                placeholder="29.90"
              />
            </div>
            <div className="form-group">
              <label>Stock par variante</label>
              <input
                type="number"
                min={0}
                value={baseStock}
                onChange={e => { setBaseStock(parseInt(e.target.value) || 0); setIsDirty(true); }}
                placeholder="10"
              />
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={generateVariants}
              disabled={!selectedSizes.length}
            >
              Générer {selectedSizes.length || 0} variantes
            </button>
          </div>
        </div>
      </div>

      {/* Liste des variantes */}
      <div className="variants-list-section">
        <div className="section-header">
          <h4>Variantes ({variants.filter(v => v.size).length})</h4>
          <button type="button" onClick={addVariantRow} className="btn btn-outline btn-sm">
            + Ajouter manuellement
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
                    aria-label="Supprimer"
                  >
                    ×
                  </button>
                </div>

                <div className="variant-card__fields">
                  <div className="field-row">
                    <div className="form-group">
                      <label>Taille</label>
                      <input
                        value={variant.size}
                        onChange={e => updateVariantField(index, 'size', e.target.value)}
                        placeholder="M"
                        required
                      />
                    </div>
                  </div>

                  <div className="field-row">
                    <div className="form-group">
                      <label>Prix (€)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={variant.price}
                        onChange={e => updateVariantField(index, 'price', e.target.value)}
                        placeholder="29.90"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Stock</label>
                      <input
                        type="number"
                        min={0}
                        value={variant.stock}
                        onChange={e => updateVariantField(index, 'stock', e.target.value)}
                        placeholder="10"
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
            <p>Aucune variante. Utilisez la génération rapide ou ajoutez manuellement.</p>
          </div>
        )}
      </div>

      {minVariantPrice != null && (
        <div className="price-summary">
          <span>Prix minimum affiché:</span>
          <strong>{minVariantPrice.toFixed(2)} €</strong>
        </div>
      )}
    </div>
  );
}
