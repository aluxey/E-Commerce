import { useEffect, useState } from 'react';
import {
  deleteCategory,
  hasProductsInCategory,
  hasSubcategories,
  insertCategory,
  listCategoriesWithParent,
  updateCategory,
} from '../../services/adminCategories';
import { pushToast } from '../ToastHost';
import { ErrorMessage, LoadingMessage } from '../StatusMessage';

export default function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    parent_id: null,
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await listCategoriesWithParent();
    if (fetchError) {
      setError('Chargement des catégories / Kategorien können nicht geladen werden.');
      setCategories([]);
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  };

  const handleChange = e => {
    const value = e.target.value === '' ? null : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await updateCategory(editingId, form);
        if (error) throw error;
        setEditingId(null);
      } else {
        const { error } = await insertCategory(form);
        if (error) throw error;
      }

      setForm({
        name: '',
        description: '',
        parent_id: null,
      });
      fetchCategories();
      pushToast({ message: editingId ? 'Catégorie mise à jour / Kategorie aktualisiert' : 'Catégorie créée / Kategorie erstellt', variant: 'success' });
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      pushToast({ message: 'Erreur lors de la sauvegarde / Speicherung fehlgeschlagen.', variant: 'error' });
    }
  };

  const handleEdit = category => {
    setForm({
      name: category.name,
      description: category.description || '',
      parent_id: category.parent_id,
    });
    setEditingId(category.id);
  };

  const handleDelete = async id => {
    try {
      const { count: subCount } = await hasSubcategories(id);
      if (subCount && subCount > 0) {
        pushToast({ message: 'Impossible de supprimer: sous-catégories présentes / Unterkategorien vorhanden.', variant: 'error' });
        return;
      }

      const { count: prodCount } = await hasProductsInCategory(id);
      if (prodCount && prodCount > 0) {
        pushToast({ message: 'Impossible de supprimer: produits liés / Verknüpfte Produkte vorhanden.', variant: 'error' });
        return;
      }

      if (confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
        const { error } = await deleteCategory(id);
        if (error) throw error;
        fetchCategories();
        pushToast({ message: 'Catégorie supprimée / Kategorie gelöscht', variant: 'success' });
      }
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      pushToast({ message: 'Erreur lors de la suppression / Löschung fehlgeschlagen.', variant: 'error' });
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({
      name: '',
      description: '',
      parent_id: null,
    });
  };

  const getMainCategories = () => categories.filter(cat => !cat.parent_id);
  const getSubcategories = parentId => categories.filter(cat => cat.parent_id === parentId);

  useEffect(() => {
    fetchCategories();
  }, []);

  if (loading) return <LoadingMessage message="Chargement des catégories..." />;
  if (error) return <ErrorMessage title="Erreur" message={error} onRetry={fetchCategories} />;

  return (
    <div className="category-manager">
      <h2>Gestion des Catégories / Kategorien</h2>

      <form onSubmit={handleSubmit} className="category-form">
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Nom de la catégorie"
          required
        />

        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description (optionnelle)"
          rows="3"
        />

        <select name="parent_id" value={form.parent_id || ''} onChange={handleChange}>
          <option value="">Catégorie principale / Hauptkategorie</option>
          {getMainCategories().map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <div className="form-buttons">
          <button type="submit">{editingId ? 'Modifier / Bearbeiten' : 'Ajouter / Hinzufügen'}</button>
          {editingId && (
            <button type="button" onClick={cancelEdit}>
              Annuler / Abbrechen
            </button>
          )}
        </div>
      </form>

      <div className="categories-list">
        <h3>Catégories existantes</h3>
        {categories.length === 0 ? (
          <p>Aucune catégorie trouvée</p>
        ) : (
          <div className="categories-tree">
            {getMainCategories().map(category => (
              <div key={category.id} className="category-item main-category">
                <div className="category-info">
                  <h4>{category.name}</h4>
                  {category.description && (
                    <p className="category-description">{category.description}</p>
                  )}
                  <div className="category-actions">
                    <button onClick={() => handleEdit(category)} aria-label="Modifier / Bearbeiten">Modifier / Bearbeiten</button>
                    <button onClick={() => handleDelete(category.id)} aria-label="Supprimer / Löschen">Supprimer / Löschen</button>
                  </div>
                </div>

                {getSubcategories(category.id).length > 0 && (
                  <div className="subcategories">
                    {getSubcategories(category.id).map(subcategory => (
                      <div key={subcategory.id} className="category-item subcategory">
                        <div className="category-info">
                          <h5>└ {subcategory.name}</h5>
                          {subcategory.description && (
                            <p className="category-description">{subcategory.description}</p>
                          )}
                          <div className="category-actions">
                            <button onClick={() => handleEdit(subcategory)} aria-label="Modifier / Bearbeiten">Modifier / Bearbeiten</button>
                            <button onClick={() => handleDelete(subcategory.id)} aria-label="Supprimer / Löschen">Supprimer / Löschen</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
