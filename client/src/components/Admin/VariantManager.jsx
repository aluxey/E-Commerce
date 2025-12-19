import { useEffect, useMemo, useState } from 'react';
import { listItemsBasic, listVariants, upsertVariant, deleteVariant } from '../../services/adminVariants';
import { listColors } from '@/services/adminColors';
import { pushToast } from '../ToastHost';
import { ErrorMessage, LoadingMessage } from '../StatusMessage';

export default function VariantManager() {
  const [variants, setVariants] = useState([]);
  const [products, setProducts] = useState([]);
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    item_id: '',
    color_id: '',
    size: '',
    price: '',
    stock: 0,
    sku: '',
  });
  const [editingId, setEditingId] = useState(null);

  const fetchVariants = async () => {
    setLoading(true);
    setError(null);
    const [variantsResp, itemsResp, colorsResp] = await Promise.all([
      listVariants(),
      listItemsBasic(),
      listColors(),
    ]);
    if (variantsResp.error || itemsResp.error || colorsResp.error) {
      setError('Impossible de charger les variantes / Varianten konnten nicht geladen werden.');
      setVariants([]);
      setProducts([]);
      setColors([]);
    } else {
      setVariants(variantsResp.data || []);
      setProducts(itemsResp.data || []);
      setColors(colorsResp.data || []);
    }
    setLoading(false);
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const colorId = form.color_id ? Number(form.color_id) : null;
      const payload = {
        item_id: Number(form.item_id),
        color_id: colorId,
        size: form.size.trim(),
        stock: Math.max(0, parseInt(form.stock, 10) || 0),
        price: parseFloat(String(form.price).replace(',', '.')),
      };

      if (!payload.item_id || !payload.size || Number.isNaN(payload.price)) {
        pushToast({ message: 'Produit, taille et prix requis / Produkt, Größe und Preis erforderlich.', variant: 'error' });
        return;
      }

      if (payload.price < 0) {
        pushToast({ message: 'Le prix doit être positif / Preis muss positiv sein.', variant: 'error' });
        return;
      }

      if (editingId) {
        const updatePayload = { ...payload };
        if (form.sku) updatePayload.sku = form.sku;
        const { error } = await upsertVariant({ ...updatePayload, id: editingId });
        if (error) throw error;
        setEditingId(null);
      } else {
        const colorCode = colorId ? (colors.find(c => c.id === colorId)?.code || colorId) : 'default';
        const skuBase = `SKU-${payload.item_id}-${payload.size}-${colorCode}`
          .toUpperCase()
          .replace(/[^A-Z0-9-]/g, '-');
        const insertPayload = {
          ...payload,
          sku: skuBase,
        };
        const { error } = await upsertVariant(insertPayload);
        if (error) throw error;
      }

      setForm({
        item_id: '',
        color_id: '',
        size: '',
        price: '',
        stock: 0,
        sku: '',
      });
      fetchVariants();
      pushToast({ message: 'Variante sauvegardée / Variante gespeichert', variant: 'success' });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      pushToast({ message: 'Impossible de sauvegarder la variante / Variante konnte nicht gespeichert werden.', variant: 'error' });
    }
  };

  const handleEdit = variant => {
    setForm({
      item_id: variant.item_id,
      color_id: variant.color_id || '',
      size: variant.size || '',
      price: variant.price,
      stock: variant.stock,
      sku: variant.sku || '',
    });
    setEditingId(variant.id);
  };

  const handleDelete = async id => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette variante ?')) {
      const { error } = await deleteVariant(id);
      if (!error) {
        fetchVariants();
        pushToast({ message: 'Variante supprimée / Variante gelöscht', variant: 'success' });
      }
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({
      item_id: '',
      color_id: '',
      size: '',
      price: '',
      stock: 0,
      sku: '',
    });
  };

  const colorById = useMemo(() => {
    const map = new Map(colors.map(color => [color.id, color]));
    return id => map.get(id) || null;
  }, [colors]);

  useEffect(() => {
    fetchVariants();
  }, []);

  if (loading) return <LoadingMessage message="Chargement des variantes..." />;
  if (error) return <ErrorMessage title="Erreur" message={error} onRetry={fetchVariants} />;

  return (
    <div className="variant-manager">
      <h2>Gestion des Variantes / Varianten</h2>

      <form onSubmit={handleSubmit} className="variant-form">
        <select name="item_id" value={form.item_id} onChange={handleChange} required>
          <option value="">Sélectionner un produit / Produkt wählen</option>
          {products.map(product => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>

        <select name="color_id" value={form.color_id} onChange={handleChange}>
          <option value="">Couleur (optionnel)</option>
          {colors.map(color => (
            <option key={color.id} value={color.id}>
              {color.name}
            </option>
          ))}
        </select>

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
          <button type="submit">{editingId ? 'Modifier / Aktualisieren' : 'Ajouter / Hinzufügen'}</button>
          {editingId && (
            <button type="button" onClick={cancelEdit}>
              Annuler / Abbrechen
            </button>
          )}
        </div>
      </form>

      <div className="variants-list">
        <h3>Variantes existantes</h3>
          {variants.length === 0 ? (
            <p>Aucune variante trouvée / Keine Variante gefunden</p>
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
                  <td>
                    {variant.colors?.name || colorById(variant.color_id)?.name || '—'}
                  </td>
                  <td>{variant.size}</td>
                  <td>{Number(variant.price).toFixed(2)}€</td>
                  <td>{variant.stock}</td>
                  <td>
                    <button onClick={() => handleEdit(variant)} aria-label="Modifier / Bearbeiten">Modifier / Bearbeiten</button>
                    <button onClick={() => handleDelete(variant.id)} aria-label="Supprimer / Löschen">Supprimer / Löschen</button>
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
