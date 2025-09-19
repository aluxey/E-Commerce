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
    size: '',
    price: '',
    stock: 0,
    sku: '',
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
    const { name, value, type } = e.target;
    if (type === 'number') {
      setForm(prev => ({ ...prev, [name]: value }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const payload = {
        item_id: Number(form.item_id),
        color: form.color.trim() ? form.color.trim() : null,
        size: form.size.trim(),
        stock: Math.max(0, parseInt(form.stock, 10) || 0),
        price: parseFloat(String(form.price).replace(',', '.')),
      };

      if (!payload.item_id || !payload.size || Number.isNaN(payload.price)) {
        alert('Produit, taille et prix sont requis.');
        return;
      }

      if (payload.price < 0) {
        alert('Le prix doit être positif.');
        return;
      }

      if (editingId) {
        const updatePayload = { ...payload };
        if (form.sku) updatePayload.sku = form.sku;
        const { error } = await supabase.from(TABLE_VARIANTS).update(updatePayload).eq('id', editingId);
        if (error) throw error;
        setEditingId(null);
      } else {
        const skuBase = `SKU-${payload.item_id}-${payload.size}-${payload.color || 'default'}`
          .toUpperCase()
          .replace(/[^A-Z0-9-]/g, '-');
        const insertPayload = {
          ...payload,
          sku: skuBase,
        };
        const { error } = await supabase.from(TABLE_VARIANTS).insert([insertPayload]);
        if (error) throw error;
      }

      setForm({
        item_id: '',
        color: '',
        size: '',
        price: '',
        stock: 0,
        sku: '',
      });
      fetchVariants();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert(error.message || 'Impossible de sauvegarder la variante.');
    }
  };

  const handleEdit = variant => {
    setForm({
      item_id: variant.item_id,
      color: variant.color,
      size: variant.size,
      price: variant.price,
      stock: variant.stock,
      sku: variant.sku,
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
      size: '',
      price: '',
      stock: 0,
      sku: '',
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
          name="size"
          value={form.size}
          onChange={handleChange}
          placeholder="Taille"
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
                <th>Taille</th>
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
                  <td>{variant.size}</td>
                  <td>{Number(variant.price).toFixed(2)}€</td>
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
