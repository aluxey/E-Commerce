import { useEffect, useState } from 'react';
import { supabase } from '../../supabase/supabaseClient';

export const TABLE_CATEGORIES = 'categories';
export const TABLE_ITEMS = 'items';

export default function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    parent_id: null,
  });
  const [editingId, setEditingId] = useState(null);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select(
        `
        *,
        parent:parent_id (
          name
        )
      `
      )
      .order('name');
    setCategories(data || []);
  };

  const handleChange = e => {
    const value = e.target.value === '' ? null : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      if (editingId) {
        await supabase.from(TABLE_CATEGORIES).update(form).eq('id', editingId);
        setEditingId(null);
      } else {
        await supabase.from(TABLE_CATEGORIES).insert([form]);
      }

      setForm({
        name: '',
        description: '',
        parent_id: null,
      });
      fetchCategories();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
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
      // Vérifier s'il y a des sous-catégories
      const { data: subcategories } = await supabase
        .from('categories')
        .select('id')
        .eq('parent_id', id);

      if (subcategories && subcategories.length > 0) {
        alert('Impossible de supprimer cette catégorie car elle contient des sous-catégories.');
        return;
      }

      // Vérifier s'il y a des produits liés
      const { data: products } = await supabase
        .from(TABLE_ITEMS)
        .select('id')
        .eq('category_id', id);

      if (products && products.length > 0) {
        alert('Impossible de supprimer cette catégorie car elle contient des produits.');
        return;
      }

      if (confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
        await supabase.from(TABLE_CATEGORIES).delete().eq('id', id);
        fetchCategories();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression de la catégorie.');
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

  const getMainCategories = () => {
    return categories.filter(cat => !cat.parent_id);
  };

  const getSubcategories = parentId => {
    return categories.filter(cat => cat.parent_id === parentId);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className="category-manager">
      <h2>Gestion des Catégories</h2>

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
          <option value="">Catégorie principale</option>
          {getMainCategories().map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <div className="form-buttons">
          <button type="submit">{editingId ? 'Modifier' : 'Ajouter'}</button>
          {editingId && (
            <button type="button" onClick={cancelEdit}>
              Annuler
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
                    <button onClick={() => handleEdit(category)}>Modifier</button>
                    <button onClick={() => handleDelete(category.id)}>Supprimer</button>
                  </div>
                </div>

                {/* Sous-catégories */}
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
                            <button onClick={() => handleEdit(subcategory)}>Modifier</button>
                            <button onClick={() => handleDelete(subcategory.id)}>Supprimer</button>
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
