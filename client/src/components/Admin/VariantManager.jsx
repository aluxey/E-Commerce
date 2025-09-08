import { useEffect, useState } from 'react';
import { supabase } from '../../supabase/supabaseClient';
import { TABLE_ITEMS } from './ProductManager';

export const TABLE_VARIANTS = 'item_variants';
export const TABLE_PRODUCTS = 'items';

export default function VariantManager() {
  const [variants, setVariants] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    item_id: '',
    color: '',
    format: '',
    price: 0,
    stock: 0,
  });
  const [editingId, setEditingId] = useState(null);

  const fetchVariants = async () => {
    const { data } = await supabase.from(TABLE_VARIANTS).select(`
        *,
        items (
          name
        )
      `);
    setVariants(data || []);
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from(TABLE_ITEMS).select('id, name');
    setProducts(data || []);
  };

  const handleChange = e => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      if (editingId) {
        await supabase.from(TABLE_VARIANTS).update(form).eq('id', editingId);
        setEditingId(null);
      } else {
        await supabase.from(TABLE_VARIANTS).insert([form]);
      }

      setForm({
        item_id: '',
        color: '',
        format: '',
        price: 0,
        stock: 0,
      });
      fetchVariants();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleEdit = variant => {
    setForm({
      item_id: variant.item_id,
      color: variant.color,
      format: variant.format,
      price: variant.price,
      stock: variant.stock,
    });
    setEditingId(variant.id);
  };

  const handleDelete = async id => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette variante ?')) {
      await supabase.from(TABLE_VARIANTS).delete().eq('id', id);
      fetchVariants();
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({
      item_id: '',
      color: '',
      format: '',
      price: 0,
      stock: 0,
    });
  };

  useEffect(() => {
    fetchVariants();
    fetchProducts();
  }, []);

  return (
    <div className="variant-manager">
      <h2>Gestion des Variantes</h2>

      <form onSubmit={handleSubmit} className="variant-form">
        <select name="item_id" value={form.item_id} onChange={handleChange} required>
          <option value="">Sélectionner un produit</option>
          {products.map(product => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>

        <input
          name="color"
          value={form.color}
          onChange={handleChange}
          placeholder="Couleur"
          required
        />

        <input
          name="format"
          value={form.format}
          onChange={handleChange}
          placeholder="Format"
          required
        />

        <input
          name="price"
          type="number"
          step="0.01"
          value={form.price}
          onChange={handleChange}
          placeholder="Prix (€)"
        />

        <input
          name="stock"
          type="number"
          value={form.stock}
          onChange={handleChange}
          placeholder="Stock"
          required
        />

        <div className="form-buttons">
          <button type="submit">{editingId ? 'Modifier' : 'Ajouter'}</button>
          {editingId && (
            <button type="button" onClick={cancelEdit}>
              Annuler
            </button>
          )}
        </div>
      </form>

      <div className="variants-list">
        <h3>Variantes existantes</h3>
        {variants.length === 0 ? (
          <p>Aucune variante trouvée</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Produit</th>
                <th>Couleur</th>
                <th>Format</th>
                <th>Prix</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {variants.map(variant => (
                <tr key={variant.id}>
                  <td>{variant.items?.name || 'N/A'}</td>
                  <td>{variant.color}</td>
                  <td>{variant.format}</td>
                  <td>{variant.price}€</td>
                  <td>{variant.stock}</td>
                  <td>
                    <button onClick={() => handleEdit(variant)}>Modifier</button>
                    <button onClick={() => handleDelete(variant.id)}>Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
