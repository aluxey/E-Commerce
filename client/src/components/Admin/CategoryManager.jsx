import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  deleteCategory,
  hasProductsInCategory,
  hasSubcategories,
  insertCategory,
  listCategoriesWithParent,
  updateCategory,
} from '../../services/adminCategories';
import { ErrorMessage, LoadingMessage } from '../StatusMessage';
import { pushToast } from '../ToastHost';

const DRAFT_KEY = 'admin-category-draft';

// Category icons for visual distinction
const CATEGORY_ICONS = [
  { icon: '🏠', label: 'Maison' },
  { icon: '👶', label: 'Bébé' },
  { icon: '👜', label: 'Accessoires' },
  { icon: '🧶', label: 'Tricot' },
  { icon: '🎁', label: 'Cadeaux' },
  { icon: '🌿', label: 'Nature' },
  { icon: '✨', label: 'Spécial' },
  { icon: '❤️', label: 'Favoris' },
  { icon: '🛒', label: 'Shopping' },
  { icon: '📦', label: 'Divers' },
];

const defaultForm = {
  name: '',
  description: '',
  parent_id: null,
  icon: '📦',
};

export default function CategoryManager() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [productCounts, setProductCounts] = useState({});

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await listCategoriesWithParent();
    if (fetchError) {
      setError(t('admin.categories.error.load', 'Impossible de charger les catégories.'));
      setCategories([]);
    } else {
      setCategories(data || []);
      // Fetch product counts
      const counts = {};
      for (const cat of data || []) {
        const { count } = await hasProductsInCategory(cat.id);
        counts[cat.id] = count || 0;
      }
      setProductCounts(counts);
      // Expand all main categories by default
      const mainIds = new Set((data || []).filter(c => !c.parent_id).map(c => c.id));
      setExpandedCategories(mainIds);
    }
    setLoading(false);
  };

  useEffect(() => {
    const draftRaw = localStorage.getItem(DRAFT_KEY);
    if (draftRaw) {
      try {
        const draft = JSON.parse(draftRaw);
        setForm({
          name: draft.name || '',
          description: draft.description || '',
          parent_id: draft.parent_id ?? null,
          icon: draft.icon || '📦',
        });
        setIsDirty(true);
      } catch (err) {
        console.warn('Could not load category draft', err);
      }
    }
    fetchCategories();
  }, []);

  useUnsavedChanges(isDirty, t('admin.categories.unsaved', 'Des modifications ne sont pas sauvegardées. Quitter ?'));

  useEffect(() => {
    if (!isDirty) return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
  }, [form, isDirty]);

  const mainCategories = useMemo(
    () => categories.filter(cat => !cat.parent_id),
    [categories]
  );

  const getSubcategories = parentId =>
    categories.filter(cat => cat.parent_id === parentId);

  const getTotalProducts = categoryId => {
    let total = productCounts[categoryId] || 0;
    const subs = getSubcategories(categoryId);
    for (const sub of subs) {
      total += productCounts[sub.id] || 0;
    }
    return total;
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value === '' ? null : value,
    }));
    setIsDirty(true);
  };

  const selectIcon = icon => {
    setForm(prev => ({ ...prev, icon }));
    setIsDirty(true);
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!form.name.trim()) {
      pushToast({ message: t('admin.categories.error.nameRequired', 'Le nom est requis.'), variant: 'error' });
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const { error } = await updateCategory(editingId, form);
        if (error) throw error;
      } else {
        const { error } = await insertCategory(form);
        if (error) throw error;
      }

      pushToast({
        message: editingId
          ? t('admin.categories.success.update', 'Catégorie mise à jour.')
          : t('admin.categories.success.create', 'Catégorie créée.'),
        variant: 'success',
      });

      closeModal();
      fetchCategories();
    } catch (err) {
      console.error('Error saving category:', err);
      pushToast({ message: t('admin.categories.error.save', 'Sauvegarde impossible.'), variant: 'error' });
    }
    setSaving(false);
  };

  const openModal = (category = null, parentId = null) => {
    if (category) {
      setForm({
        name: category.name,
        description: category.description || '',
        parent_id: category.parent_id,
        icon: category.icon || '📦',
      });
      setEditingId(category.id);
    } else {
      setForm({ ...defaultForm, parent_id: parentId });
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

  const handleDelete = async category => {
    try {
      const { count: subCount } = await hasSubcategories(category.id);
      if (subCount && subCount > 0) {
        pushToast({
          message: t('admin.categories.error.hasSubcategories', 'Impossible: sous-catégories présentes.'),
          variant: 'error',
        });
        return;
      }

      const { count: prodCount } = await hasProductsInCategory(category.id);
      if (prodCount && prodCount > 0) {
        pushToast({
          message: t('admin.categories.error.hasProducts', 'Impossible: produits liés.'),
          variant: 'error',
        });
        return;
      }

      if (!confirm(t('admin.categories.confirm.delete', `Supprimer "${category.name}" ?`))) {
        return;
      }

      const { error } = await deleteCategory(category.id);
      if (error) throw error;

      pushToast({ message: t('admin.categories.success.delete', 'Catégorie supprimée.'), variant: 'success' });
      fetchCategories();
    } catch (err) {
      console.error('Error deleting category:', err);
      pushToast({ message: t('admin.categories.error.delete', 'Suppression impossible.'), variant: 'error' });
    }
  };

  const toggleExpand = categoryId => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  if (loading) return <LoadingMessage message={t('admin.common.loading', 'Chargement...')} />;
  if (error) return <ErrorMessage title="Erreur" message={error} onRetry={fetchCategories} />;

  return (
    <div className="category-manager-v2">
      {/* Header */}
      <div className="manager-header">
        <div className="manager-header__left">
          <h2>{t('admin.categories.tree', 'Arborescence')}</h2>
          <span className="product-count">
            {mainCategories.length} {t('admin.categories.mainCount', 'catégorie(s) principale(s)')}
          </span>
        </div>
        <div className="manager-header__right">
          <button className="btn btn-primary" onClick={() => openModal()}>
            + {t('admin.categories.addMain', 'Catégorie principale')}
          </button>
        </div>
      </div>

      {/* Category Tree */}
      {mainCategories.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">📂</div>
          <h3>{t('admin.categories.empty.title', 'Aucune catégorie')}</h3>
          <p>{t('admin.categories.empty.description', 'Créez votre première catégorie pour organiser vos produits.')}</p>
          <button className="btn btn-primary" onClick={() => openModal()}>
            + {t('admin.categories.addMain', 'Catégorie principale')}
          </button>
        </div>
      ) : (
        <div className="category-tree">
          {mainCategories.map(category => {
            const subcategories = getSubcategories(category.id);
            const isExpanded = expandedCategories.has(category.id);
            const totalProducts = getTotalProducts(category.id);

            return (
              <div key={category.id} className="category-tree__item">
                {/* Main Category Card */}
                <div className="category-card category-card--main">
                  <div className="category-card__left">
                    {subcategories.length > 0 && (
                      <button
                        className={`expand-btn ${isExpanded ? 'is-expanded' : ''}`}
                        onClick={() => toggleExpand(category.id)}
                        aria-label={isExpanded ? 'Réduire' : 'Développer'}
                      >
                        ▶
                      </button>
                    )}
                    <span className="category-icon">{category.icon || '📦'}</span>
                    <div className="category-card__info">
                      <h4 className="category-name">{category.name}</h4>
                      {category.description && (
                        <p className="category-description">{category.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="category-card__right">
                    <div className="category-stats">
                      <span className="stat-badge">
                        {subcategories.length} {t('admin.categories.subs', 'sous-cat.')}
                      </span>
                      <span className="stat-badge stat-badge--products">
                        {totalProducts} {t('admin.categories.products', 'produits')}
                      </span>
                    </div>
                    <div className="category-card__actions">
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => openModal(null, category.id)}
                        title={t('admin.categories.addSub', 'Ajouter sous-catégorie')}
                      >
                        + {t('admin.categories.sub', 'Sous-cat.')}
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => openModal(category)}
                        title={t('admin.common.edit', 'Modifier')}
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-icon btn-remove"
                        onClick={() => handleDelete(category)}
                        title={t('admin.common.delete', 'Supprimer')}
                        disabled={subcategories.length > 0 || totalProducts > 0}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>

                {/* Subcategories */}
                {isExpanded && subcategories.length > 0 && (
                  <div className="subcategories-list">
                    {subcategories.map(sub => (
                      <div key={sub.id} className="category-card category-card--sub">
                        <div className="category-card__left">
                          <span className="subcategory-connector">└</span>
                          <span className="category-icon category-icon--small">{sub.icon || '📁'}</span>
                          <div className="category-card__info">
                            <h5 className="category-name">{sub.name}</h5>
                            {sub.description && (
                              <p className="category-description">{sub.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="category-card__right">
                          <span className="stat-badge stat-badge--products">
                            {productCounts[sub.id] || 0} {t('admin.categories.products', 'produits')}
                          </span>
                          <div className="category-card__actions">
                            <button
                              className="btn-icon"
                              onClick={() => openModal(sub)}
                              title={t('admin.common.edit', 'Modifier')}
                            >
                              ✏️
                            </button>
                            <button
                              className="btn-icon btn-remove"
                              onClick={() => handleDelete(sub)}
                              title={t('admin.common.delete', 'Supprimer')}
                              disabled={(productCounts[sub.id] || 0) > 0}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {editingId
                  ? t('admin.categories.editTitle', 'Modifier la catégorie')
                  : form.parent_id
                    ? t('admin.categories.createSubTitle', 'Nouvelle sous-catégorie')
                    : t('admin.categories.createTitle', 'Nouvelle catégorie')}
              </h3>
              <button className="btn-close" onClick={closeModal}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-body">
              {/* Icon Selector */}
              <div className="icon-selector">
                <label>{t('admin.categories.form.icon', 'Icône')}</label>
                <div className="icon-grid">
                  {CATEGORY_ICONS.map(({ icon, label }) => (
                    <button
                      key={icon}
                      type="button"
                      className={`icon-btn ${form.icon === icon ? 'is-selected' : ''}`}
                      onClick={() => selectIcon(icon)}
                      title={label}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Fields */}
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="cat-name">
                    {t('admin.categories.form.name', 'Nom')} <span className="required">*</span>
                  </label>
                  <input
                    id="cat-name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder={t('admin.categories.form.namePlaceholder', 'Ex: Textiles déco')}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="cat-description">
                    {t('admin.categories.form.description', 'Description')}
                  </label>
                  <textarea
                    id="cat-description"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder={t('admin.categories.form.descPlaceholder', 'Description courte de la catégorie...')}
                    rows="3"
                  />
                </div>

                {!editingId && (
                  <div className="form-group">
                    <label htmlFor="cat-parent">
                      {t('admin.categories.form.parent', 'Catégorie parente')}
                    </label>
                    <select
                      id="cat-parent"
                      name="parent_id"
                      value={form.parent_id || ''}
                      onChange={handleChange}
                    >
                      <option value="">{t('admin.categories.form.noParent', '— Catégorie principale —')}</option>
                      {mainCategories.map(cat => (
                        <option key={cat.id} value={cat.id} disabled={editingId === cat.id}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </select>
                    <p className="input-hint">
                      {t('admin.categories.form.parentHint', 'Laissez vide pour une catégorie principale')}
                    </p>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeModal}>
                  {t('admin.common.cancel', 'Annuler')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving
                    ? t('admin.common.loading', 'Chargement...')
                    : editingId
                      ? t('admin.common.update', 'Mettre à jour')
                      : t('admin.common.create', 'Créer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
