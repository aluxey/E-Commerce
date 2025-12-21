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
      if (modal.category) {
        await updateCategory(modal.category.id, payload);
        pushToast({ message: "Catégorie modifiée ✓", variant: "success" });
      } else {
        await insertCategory(payload);
        pushToast({ message: "Catégorie créée ✓", variant: "success" });
      }
      closeModal();
      fetchData();
    } catch {
      pushToast({ message: "Erreur", variant: "error" });
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
    
    await deleteCategory(cat.id);
    pushToast({ message: "Supprimée ✓", variant: "success" });
    fetchData();
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

      <style>{`
        .cat-manager { padding: 0; }
        
        .cat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .cat-header h2 { margin: 0; font-size: 1.5rem; }
        .cat-subtitle { margin: 0.25rem 0 0; color: #888; font-size: 0.875rem; }
        
        .cat-btn {
          padding: 0.5rem 1rem;
          border: 1px solid #ddd;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.15s;
        }
        .cat-btn:hover { background: #f5f5f5; }
        .cat-btn--primary {
          background: var(--adm-brand, #b75c3b);
          color: white;
          border-color: var(--adm-brand, #b75c3b);
        }
        .cat-btn--primary:hover { opacity: 0.9; }
        
        .cat-empty {
          text-align: center;
          padding: 4rem 2rem;
          background: #fafafa;
          border-radius: 12px;
        }
        .cat-empty-icon { font-size: 3rem; display: block; margin-bottom: 1rem; }
        .cat-empty p { color: #888; margin-bottom: 1.5rem; }
        
        .cat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1rem;
        }
        
        .cat-card {
          background: white;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          overflow: hidden;
        }
        
        .cat-card-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: linear-gradient(135deg, #fafafa 0%, #fff 100%);
          border-bottom: 1px solid #eee;
        }
        .cat-card-icon {
          font-size: 2rem;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border-radius: 10px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .cat-card-info { flex: 1; min-width: 0; }
        .cat-card-info h3 { margin: 0; font-size: 1rem; font-weight: 600; }
        .cat-card-meta { font-size: 0.75rem; color: #888; }
        .cat-card-actions {
          display: flex;
          gap: 0.25rem;
        }
        .cat-card-actions button {
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          cursor: pointer;
          border-radius: 6px;
          opacity: 0.5;
          transition: all 0.15s;
        }
        .cat-card-actions button:hover { opacity: 1; background: #f0f0f0; }
        .cat-card-actions button:disabled { opacity: 0.2; cursor: not-allowed; }
        
        .cat-subcats { padding: 0.5rem; }
        
        .cat-subcat {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          border-radius: 8px;
          transition: background 0.15s;
        }
        .cat-subcat:hover { background: #f5f5f5; }
        .cat-subcat-icon { font-size: 1rem; }
        .cat-subcat-name { flex: 1; font-size: 0.875rem; }
        .cat-subcat-count {
          font-size: 0.75rem;
          color: #888;
          background: #f0f0f0;
          padding: 0.125rem 0.5rem;
          border-radius: 99px;
        }
        .cat-subcat-edit, .cat-subcat-del {
          width: 24px;
          height: 24px;
          border: none;
          background: transparent;
          cursor: pointer;
          opacity: 0;
          font-size: 0.75rem;
          border-radius: 4px;
        }
        .cat-subcat:hover .cat-subcat-edit,
        .cat-subcat:hover .cat-subcat-del { opacity: 0.5; }
        .cat-subcat-edit:hover, .cat-subcat-del:hover { opacity: 1 !important; background: #e5e5e5; }
        .cat-subcat-del:disabled { opacity: 0.2 !important; cursor: not-allowed; }
        
        .cat-add-sub {
          width: 100%;
          padding: 0.5rem;
          border: 1px dashed #ddd;
          border-radius: 8px;
          background: transparent;
          color: #888;
          cursor: pointer;
          font-size: 0.8rem;
          transition: all 0.15s;
          margin-top: 0.25rem;
        }
        .cat-add-sub:hover { border-color: var(--adm-brand, #b75c3b); color: var(--adm-brand, #b75c3b); }
        
        /* Modal */
        .cat-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }
        .cat-modal {
          background: white;
          border-radius: 16px;
          width: 100%;
          max-width: 400px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }
        .cat-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid #eee;
        }
        .cat-modal-header h3 { margin: 0; font-size: 1.1rem; }
        .cat-modal-close {
          width: 32px;
          height: 32px;
          border: none;
          background: #f0f0f0;
          border-radius: 50%;
          cursor: pointer;
          font-size: 1.25rem;
          line-height: 1;
        }
        .cat-modal-close:hover { background: #e5e5e5; }
        
        .cat-modal-form { padding: 1.25rem; }
        
        .cat-icons {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }
        .cat-icon-btn {
          width: 40px;
          height: 40px;
          border: 2px solid #eee;
          border-radius: 10px;
          background: white;
          cursor: pointer;
          font-size: 1.25rem;
          transition: all 0.15s;
        }
        .cat-icon-btn:hover { border-color: #ccc; }
        .cat-icon-btn.selected {
          border-color: var(--adm-brand, #b75c3b);
          background: rgba(183, 92, 59, 0.1);
        }
        
        .cat-input, .cat-select {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 1rem;
          margin-bottom: 1rem;
        }
        .cat-input:focus, .cat-select:focus {
          outline: none;
          border-color: var(--adm-brand, #b75c3b);
        }
        
        .cat-modal-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }
        .cat-modal-actions .cat-btn { flex: 1; padding: 0.75rem; }
      `}</style>
    </div>
  );
}
