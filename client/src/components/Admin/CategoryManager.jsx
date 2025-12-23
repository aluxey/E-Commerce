import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  countAllCategoryProducts,
  deleteCategory,
  hasProductsInCategory,
  hasSubcategories,
  insertCategory,
  listCategoriesWithParent,
  updateCategory,
} from "../../services/adminCategories";
import "../../styles/CategoryManager.css";
import { ErrorMessage, LoadingMessage } from "../StatusMessage";
import { pushToast } from "../ToastHost";

const ICONS = ["🧺", "🎁", "⭐", "🌸", "🍂", "❄️", "🐰", "🏠", "👜", "✨"];

export default function CategoryManager() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [productCounts, setProductCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal state
  const [modal, setModal] = useState({ open: false, category: null, parentId: null });
  const [form, setForm] = useState({ name: "", icon: "🧺", parent_id: null });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [catRes, countRes] = await Promise.all([
      listCategoriesWithParent(),
      countAllCategoryProducts(),
    ]);
    if (catRes.error) {
      setError("Erreur de chargement");
    } else {
      setCategories(catRes.data || []);
      setProductCounts(countRes.data || {});
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const mainCategories = useMemo(() => categories.filter(c => !c.parent_id), [categories]);
  const getSubcats = (parentId) => categories.filter(c => c.parent_id === parentId);
  const getProductCount = (id) => {
    let count = productCounts[id] || 0;
    getSubcats(id).forEach(sub => { count += productCounts[sub.id] || 0; });
    return count;
  };

  // Modal handlers
  const openModal = (category = null, parentId = null) => {
    setForm({
      name: category?.name || "",
      icon: category?.icon || "🧺",
      parent_id: parentId || category?.parent_id || null,
    });
    setModal({ open: true, category, parentId });
  };

  const closeModal = () => {
    setModal({ open: false, category: null, parentId: null });
    setForm({ name: "", icon: "🧺", parent_id: null });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return pushToast({ message: "Nom requis", variant: "error" });
    
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), icon: form.icon, parent_id: form.parent_id };
      let result;
      
      if (modal.category) {
        result = await updateCategory(modal.category.id, payload);
      } else {
        result = await insertCategory(payload);
      }
      
      if (result.error) {
        console.error("Supabase error:", result.error);
        pushToast({ 
          message: result.error.message || "Erreur lors de l'enregistrement", 
          variant: "error" 
        });
      } else {
        pushToast({ 
          message: modal.category ? "Catégorie modifiée ✓" : "Catégorie créée ✓", 
          variant: "success" 
        });
        closeModal();
        fetchData();
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      pushToast({ message: "Erreur inattendue", variant: "error" });
    }
    setSaving(false);
  };

  const handleDelete = async (cat) => {
    const [{ count: subs }, { count: prods }] = await Promise.all([
      hasSubcategories(cat.id),
      hasProductsInCategory(cat.id),
    ]);
    if (subs > 0) return pushToast({ message: "Supprimez d'abord les sous-catégories", variant: "error" });
    if (prods > 0) return pushToast({ message: "Catégorie utilisée par des produits", variant: "error" });
    if (!confirm(`Supprimer "${cat.name}" ?`)) return;
    
    const { error } = await deleteCategory(cat.id);
    if (error) {
      console.error("Delete error:", error);
      pushToast({ message: error.message || "Erreur de suppression", variant: "error" });
    } else {
      pushToast({ message: "Supprimée ✓", variant: "success" });
      fetchData();
    }
  };

  if (loading) return <LoadingMessage />;
  if (error) return <ErrorMessage message={error} onRetry={fetchData} />;

  return (
    <div className="cat-manager">
      {/* Header */}
      <div className="cat-header">
        <div>
          <h2>Catégories</h2>
          <p className="cat-subtitle">{categories.length} catégories • {Object.values(productCounts).reduce((a, b) => a + b, 0)} produits</p>
        </div>
        <button className="cat-btn cat-btn--primary" onClick={() => openModal()}>
          + Nouvelle catégorie
        </button>
      </div>

      {/* Grid View */}
      {mainCategories.length === 0 ? (
        <div className="cat-empty">
          <span className="cat-empty-icon">📂</span>
          <p>Aucune catégorie</p>
          <button className="cat-btn cat-btn--primary" onClick={() => openModal()}>
            Créer une catégorie
          </button>
        </div>
      ) : (
        <div className="cat-grid">
          {mainCategories.map(cat => {
            const subcats = getSubcats(cat.id);
            const count = getProductCount(cat.id);
            return (
              <div key={cat.id} className="cat-card">
                <div className="cat-card-header">
                  <span className="cat-card-icon">{cat.icon || "📦"}</span>
                  <div className="cat-card-info">
                    <h3>{cat.name}</h3>
                    <span className="cat-card-meta">{count} produits</span>
                  </div>
                  <div className="cat-card-actions">
                    <button onClick={() => openModal(cat)} title="Modifier">✏️</button>
                    <button onClick={() => handleDelete(cat)} disabled={subcats.length > 0 || count > 0} title="Supprimer">🗑️</button>
                  </div>
                </div>
                
                {/* Subcategories */}
                <div className="cat-subcats">
                  {subcats.map(sub => (
                    <div key={sub.id} className="cat-subcat">
                      <span className="cat-subcat-icon">{sub.icon || "📁"}</span>
                      <span className="cat-subcat-name">{sub.name}</span>
                      <span className="cat-subcat-count">{productCounts[sub.id] || 0}</span>
                      <button onClick={() => openModal(sub)} className="cat-subcat-edit">✏️</button>
                      <button onClick={() => handleDelete(sub)} disabled={(productCounts[sub.id] || 0) > 0} className="cat-subcat-del">×</button>
                    </div>
                  ))}
                  <button className="cat-add-sub" onClick={() => openModal(null, cat.id)}>
                    + Sous-catégorie
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modal.open && (
        <div className="cat-modal-overlay" onClick={closeModal}>
          <div className="cat-modal" onClick={e => e.stopPropagation()}>
            <div className="cat-modal-header">
              <h3>{modal.category ? "Modifier" : modal.parentId ? "Nouvelle sous-catégorie" : "Nouvelle catégorie"}</h3>
              <button onClick={closeModal} className="cat-modal-close">×</button>
            </div>
            
            <form onSubmit={handleSave} className="cat-modal-form">
              {/* Icon picker */}
              <div className="cat-icons">
                {ICONS.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    className={`cat-icon-btn ${form.icon === icon ? "selected" : ""}`}
                    onClick={() => setForm(f => ({ ...f, icon }))}
                  >
                    {icon}
                  </button>
                ))}
              </div>

              {/* Name input */}
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Nom de la catégorie"
                className="cat-input"
                autoFocus
              />

              {/* Parent selector (only for new categories) */}
              {!modal.category && (
                <select
                  value={form.parent_id || ""}
                  onChange={e => setForm(f => ({ ...f, parent_id: e.target.value || null }))}
                  className="cat-select"
                >
                  <option value="">— Catégorie principale —</option>
                  {mainCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              )}

              {/* Actions */}
              <div className="cat-modal-actions">
                <button type="button" onClick={closeModal} className="cat-btn">Annuler</button>
                <button type="submit" disabled={saving} className="cat-btn cat-btn--primary">
                  {saving ? "..." : modal.category ? "Enregistrer" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
