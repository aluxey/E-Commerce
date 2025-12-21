import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { countAllColorUsages, deleteColor, listColors, upsertColor } from "@/services/adminColors";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ErrorMessage, LoadingMessage } from "../StatusMessage";
import { pushToast } from "../ToastHost";

const defaultForm = { name: "", code: "", hex_code: "#1E90FF" };
const DRAFT_KEY = "admin-color-draft";

// Preset color palette for quick selection
const PRESET_COLORS = [
  { name: "Blanc", hex: "#FFFFFF" },
  { name: "Noir", hex: "#000000" },
  { name: "Rouge", hex: "#E53E3E" },
  { name: "Bleu", hex: "#3B82F6" },
  { name: "Vert", hex: "#10B981" },
  { name: "Jaune", hex: "#F59E0B" },
  { name: "Rose", hex: "#EC4899" },
  { name: "Violet", hex: "#8B5CF6" },
  { name: "Orange", hex: "#F97316" },
  { name: "Gris", hex: "#6B7280" },
  { name: "Beige", hex: "#D4B896" },
  { name: "Marron", hex: "#8B4513" },
  { name: "Turquoise", hex: "#06B6D4" },
  { name: "Corail", hex: "#FF6B6B" },
  { name: "Lavande", hex: "#A78BFA" },
  { name: "Menthe", hex: "#34D399" },
];

const normalizeHex = value => {
  if (!value) return "#000000";
  const cleaned = value.trim();
  if (!cleaned) return "#000000";
  const withHash = cleaned.startsWith("#") ? cleaned : `#${cleaned}`;
  return withHash.toUpperCase();
};

const normalizeCode = value => {
  const base = (value || "").trim().toLowerCase();
  return base
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_-]/g, "")
    .replace(/_+/g, "_")
    .replace(/-+/g, "-");
};

const getContrastColor = hex => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#FFFFFF";
};

export default function ColorManager() {
  const { t } = useTranslation();
  const [colors, setColors] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [usageCounts, setUsageCounts] = useState({});

  const currentHex = useMemo(() => normalizeHex(form.hex_code), [form.hex_code]);

  const filteredColors = useMemo(() => {
    if (!searchTerm) return colors;
    const term = searchTerm.toLowerCase();
    return colors.filter(
      c => c.name.toLowerCase().includes(term) || c.code.toLowerCase().includes(term)
    );
  }, [colors, searchTerm]);

  const fetchColors = async () => {
    setLoading(true);
    setError(null);

    // Charger les couleurs et les usages en parallèle
    const [colorsResult, usagesResult] = await Promise.all([listColors(), countAllColorUsages()]);

    if (colorsResult.error) {
      setError(t("admin.colors.error.load", "Impossible de charger les couleurs."));
      setColors([]);
    } else {
      setColors(colorsResult.data || []);
      setUsageCounts(usagesResult.data || {});
    }
    setLoading(false);
  };

  useEffect(() => {
    const draftRaw = localStorage.getItem(DRAFT_KEY);
    if (draftRaw) {
      try {
        const draft = JSON.parse(draftRaw);
        if (draft && typeof draft === "object") {
          setForm({
            name: draft.name || "",
            code: draft.code || "",
            hex_code: draft.hex_code || "#1E90FF",
          });
          setIsDirty(true);
        }
      } catch (err) {
        console.warn("Could not load color draft", err);
      }
    }
    fetchColors();
  }, []);

  useUnsavedChanges(
    isDirty,
    t("admin.colors.unsaved", "Des modifications ne sont pas sauvegardées. Quitter ?")
  );

  useEffect(() => {
    if (!isDirty) return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
  }, [form, isDirty]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => {
      const next = { ...prev, [name]: value };
      if (name === "name") {
        const currentGenerated = normalizeCode(prev.name);
        if (!prev.code || prev.code === currentGenerated) {
          next.code = normalizeCode(value);
        }
      }
      if (name === "code") {
        next.code = normalizeCode(value);
      }
      return next;
    });
    setIsDirty(true);
  };

  const selectPresetColor = preset => {
    setForm(prev => ({
      ...prev,
      name: prev.name || preset.name,
      code: prev.code || normalizeCode(preset.name),
      hex_code: preset.hex,
    }));
    setIsDirty(true);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      code: normalizeCode(form.code),
      hex_code: normalizeHex(form.hex_code),
    };

    if (!payload.name) {
      pushToast({
        message: t("admin.colors.error.nameRequired", "Le nom est requis."),
        variant: "error",
      });
      return;
    }

    if (!payload.code) {
      pushToast({
        message: t("admin.colors.error.codeRequired", "Le code est requis."),
        variant: "error",
      });
      return;
    }

    if (!/^[a-z0-9_-]+$/.test(payload.code)) {
      pushToast({
        message: t("admin.colors.error.codeInvalid", "Code invalide."),
        variant: "error",
      });
      return;
    }

    if (!/^#([0-9A-F]{6})$/i.test(payload.hex_code)) {
      pushToast({
        message: t("admin.colors.error.hexInvalid", "Code couleur invalide (#RRGGBB)."),
        variant: "error",
      });
      return;
    }

    setSaving(true);
    const { error: saveError } = await upsertColor(
      editingId ? { ...payload, id: editingId } : payload
    );
    setSaving(false);

    if (saveError) {
      console.error("Error saving color:", saveError);
      pushToast({
        message: t("admin.colors.error.save", "Sauvegarde impossible."),
        variant: "error",
      });
      return;
    }

    pushToast({
      message: editingId
        ? t("admin.colors.success.update", "Couleur mise à jour.")
        : t("admin.colors.success.create", "Couleur créée."),
      variant: "success",
    });

    closeModal();
    fetchColors();
  };

  const openModal = (color = null) => {
    if (color) {
      setForm({ name: color.name, code: color.code, hex_code: color.hex_code });
      setEditingId(color.id);
    } else {
      setForm(defaultForm);
      setEditingId(null);
    }
    setIsDirty(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(defaultForm);
    setEditingId(null);
    setIsDirty(false);
    localStorage.removeItem(DRAFT_KEY);
  };

  const handleDelete = async color => {
    const { count, error: usageError } = await countColorUsage(color.id);
    if (usageError) {
      pushToast({
        message: t("admin.colors.error.checkUsage", "Impossible de vérifier l'usage."),
        variant: "error",
      });
      return;
    }
    if (count && count > 0) {
      pushToast({
        message: t("admin.colors.error.inUse", `Utilisée par ${count} produit(s).`),
        variant: "error",
      });
      return;
    }

    if (!confirm(t("admin.colors.confirm.delete", `Supprimer "${color.name}" ?`))) return;

    const { error: deleteError } = await deleteColor(color.id);
    if (deleteError) {
      pushToast({
        message: t("admin.colors.error.delete", "Suppression impossible."),
        variant: "error",
      });
      return;
    }
    pushToast({
      message: t("admin.colors.success.delete", "Couleur supprimée."),
      variant: "success",
    });
    fetchColors();
  };

  if (loading) return <LoadingMessage message={t("admin.common.loading", "Chargement...")} />;
  if (error) return <ErrorMessage title="Erreur" message={error} onRetry={fetchColors} />;

  return (
    <div className="color-manager-v2">
      {/* Header */}
      <div className="manager-header">
        <div className="manager-header__left">
          <h2>{t("admin.colors.available", "Palette de couleurs")}</h2>
          <span className="product-count">
            {colors.length} {t("admin.colors.count", "couleur(s)")}
          </span>
        </div>
        <div className="manager-header__right">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder={t("admin.common.search", "Rechercher...")}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => openModal()}>
            + {t("admin.colors.add", "Nouvelle couleur")}
          </button>
        </div>
      </div>

      {/* Color Palette Grid */}
      {filteredColors.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">🎨</div>
          <h3>{t("admin.colors.empty.title", "Aucune couleur")}</h3>
          <p>
            {t("admin.colors.empty.description", "Commencez par créer votre première couleur.")}
          </p>
          <button className="btn btn-primary" onClick={() => openModal()}>
            + {t("admin.colors.add", "Nouvelle couleur")}
          </button>
        </div>
      ) : (
        <div className="color-palette-grid">
          {filteredColors.map(color => (
            <div
              key={color.id}
              className="color-palette-card"
              style={{
                "--color-hex": color.hex_code,
                "--color-contrast": getContrastColor(color.hex_code),
              }}
            >
              <div
                className="color-palette-card__swatch"
                style={{ backgroundColor: color.hex_code }}
              >
                <span className="color-hex-label">{color.hex_code}</span>
              </div>
              <div className="color-palette-card__info">
                <h4 className="color-palette-name">{color.name}</h4>
                <code className="color-palette-code">{color.code}</code>
                {usageCounts[color.id] > 0 && (
                  <span className="color-usage-badge">
                    {usageCounts[color.id]} {t("admin.colors.products", "produit(s)")}
                  </span>
                )}
              </div>
              <div className="color-palette-card__actions">
                <button
                  className="btn-icon"
                  onClick={() => openModal(color)}
                  title={t("admin.common.edit", "Modifier")}
                >
                  ✏️
                </button>
                <button
                  className="btn-icon btn-remove"
                  onClick={() => handleDelete(color)}
                  title={t("admin.common.delete", "Supprimer")}
                  disabled={usageCounts[color.id] > 0}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {editingId
                  ? t("admin.colors.editTitle", "Modifier la couleur")
                  : t("admin.colors.createTitle", "Nouvelle couleur")}
              </h3>
              <button className="btn-close" onClick={closeModal}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-body">
              {/* Color Preview */}
              <div className="color-preview-large" style={{ backgroundColor: currentHex }}>
                <span style={{ color: getContrastColor(currentHex) }}>{currentHex}</span>
              </div>

              {/* Preset Colors */}
              <div className="preset-colors-section">
                <label>{t("admin.colors.presets", "Couleurs prédéfinies")}</label>
                <div className="preset-colors-grid">
                  {PRESET_COLORS.map(preset => (
                    <button
                      key={preset.hex}
                      type="button"
                      className={`preset-color-btn ${
                        currentHex === preset.hex ? "is-selected" : ""
                      }`}
                      style={{ backgroundColor: preset.hex }}
                      onClick={() => selectPresetColor(preset)}
                      title={preset.name}
                    >
                      {currentHex === preset.hex && <span className="check">✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Fields */}
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="color-name">
                    {t("admin.colors.form.name", "Nom")} <span className="required">*</span>
                  </label>
                  <input
                    id="color-name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder={t("admin.colors.form.namePlaceholder", "Ex: Bleu Glacé")}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="color-code">
                    {t("admin.colors.form.code", "Code interne")}{" "}
                    <span className="required">*</span>
                  </label>
                  <input
                    id="color-code"
                    name="code"
                    value={form.code}
                    onChange={handleChange}
                    placeholder="ex: bleu_glace"
                    required
                  />
                  <p className="input-hint">
                    {t("admin.colors.form.codeHint", "Slug technique (a-z, 0-9, tirets)")}
                  </p>
                </div>

                <div className="form-group">
                  <label htmlFor="color-hex">
                    {t("admin.colors.form.hex", "Code hexadécimal")}{" "}
                    <span className="required">*</span>
                  </label>
                  <div className="color-input-wrapper">
                    <input
                      type="color"
                      value={currentHex}
                      onChange={e => setForm(prev => ({ ...prev, hex_code: e.target.value }))}
                      className="color-picker-input"
                    />
                    <input
                      id="color-hex"
                      name="hex_code"
                      value={form.hex_code}
                      onChange={handleChange}
                      placeholder="#1E90FF"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeModal}>
                  {t("admin.common.cancel", "Annuler")}
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving
                    ? t("admin.common.loading", "Chargement...")
                    : editingId
                    ? t("admin.common.update", "Mettre à jour")
                    : t("admin.common.create", "Créer")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
