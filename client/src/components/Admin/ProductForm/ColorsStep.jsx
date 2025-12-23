/**
 * ColorsStep - Color selection step
 */
export default function ColorsStep({ colors, selectedColors, toggleColor }) {
  return (
    <div className="wizard-step">
      <div className="step-header">
        <h3>Couleurs disponibles</h3>
        <p className="step-description">Sélectionnez les couleurs dans lesquelles ce produit est disponible.</p>
      </div>

      {colors.length === 0 ? (
        <div className="empty-state-inline">
          <span className="empty-icon">🎨</span>
          <p>Aucune couleur disponible.</p>
          <a href="/admin/colors" className="btn btn-outline btn-sm">Créer des couleurs</a>
        </div>
      ) : (
        <div className="color-grid">
          {colors.map(color => {
            const checked = selectedColors.includes(color.id);
            return (
              <button
                key={color.id}
                type="button"
                className={`color-card ${checked ? 'is-selected' : ''}`}
                onClick={() => toggleColor(color.id)}
              >
                <span
                  className="color-preview"
                  style={{ backgroundColor: color.hex_code }}
                />
                <span className="color-name">{color.name}</span>
                {checked && <span className="check-icon">✓</span>}
              </button>
            );
          })}
        </div>
      )}

      <div className="selection-summary">
        {selectedColors.length > 0 ? (
          <p>✓ {selectedColors.length} couleur{selectedColors.length > 1 ? 's' : ''} sélectionnée{selectedColors.length > 1 ? 's' : ''}</p>
        ) : (
          <p className="warning">Sélectionnez au moins une couleur</p>
        )}
      </div>
    </div>
  );
}
