import { useTranslation } from "react-i18next";

/**
 * ColorsStep - Color selection step
 */
export default function ColorsStep({ colors, selectedColors, toggleColor, setSelectedColors }) {
  const { t } = useTranslation();
  // Sélectionner ou désélectionner toutes les couleurs
  const handleSelectAll = () => {
    if (selectedColors.length === colors.length) {
      // Tout désélectionner
      setSelectedColors([]);
    } else {
      // Tout sélectionner
      setSelectedColors(colors.map(c => c.id));
    }
  };

  const allSelected = colors.length > 0 && selectedColors.length === colors.length;

  return (
    <div className="wizard-step">
      <div className="step-header">
        <h3>{t("admin.products.wizard.colors.title")}</h3>
        <p className="step-description">
          {t("admin.products.wizard.colors.description")}
        </p>
      </div>

      {colors.length === 0 ? (
        <div className="empty-state-inline">
          <span className="empty-icon">🎨</span>
          <p>{t("admin.products.wizard.colors.noColors")}</p>
          <a href="/admin/colors" className="btn btn-outline btn-sm">
            {t("admin.products.wizard.colors.createColors")}
          </a>
        </div>
      ) : (
        <>
          <div className="color-actions">
            <button type="button" className="btn btn-outline btn-sm" onClick={handleSelectAll}>
              {allSelected ? t("admin.products.wizard.colors.unselectAll") : t("admin.products.wizard.colors.selectAll")}
            </button>
          </div>
          <div className="color-grid">
            {colors.map(color => {
              const checked = selectedColors.includes(color.id);
              return (
                <button
                  key={color.id}
                  type="button"
                  className={`color-card ${checked ? "is-selected" : ""}`}
                  onClick={() => toggleColor(color.id)}
                >
                  <span className="color-preview" style={{ backgroundColor: color.hex_code }} />
                  <span className="color-name">{color.name}</span>
                  {checked && <span className="check-icon">✓</span>}
                </button>
              );
            })}
          </div>
        </>
      )}

      <div className="selection-summary">
        {selectedColors.length > 0 ? (
          <p>
            ✓ {t("admin.products.wizard.colors.selected", { count: selectedColors.length })}
          </p>
        ) : (
          <p className="warning">{t("admin.products.wizard.colors.selectWarning")}</p>
        )}
      </div>
    </div>
  );
}
