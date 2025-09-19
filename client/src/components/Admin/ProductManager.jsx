import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../supabase/supabaseClient';

export const TABLE_ITEMS = 'items';
const TABLE_CATEGORIES = 'categories';
const TABLE_VARIANTS = 'item_variants';

const createEmptyVariant = () => ({
  id: null,
  size: '',
  color: '',
  price: '',
  stock: 0,
  sku: '',
});

const sanitizeText = value => (value || '').trim();

const slugify = value =>
  sanitizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const randomSuffix = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 8).toUpperCase();

const buildSku = (itemId, variant) => {
  const sizeSlug = slugify(variant.size) || 'std';
  const colorSlug = slugify(variant.color || '') || 'def';
  return `SKU-${itemId}-${sizeSlug}-${colorSlug}-${randomSuffix()}`.toUpperCase();
};

export default function ProductAdmin() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    category_id: '',
  });

  const [variants, setVariants] = useState([createEmptyVariant()]);
  const [newImages, setNewImages] = useState([]); // File[]
  const [imagePreviews, setImagePreviews] = useState([]); // local URL previews

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      category_id: '',
    });
    setVariants([createEmptyVariant()]);
    setEditingId(null);
    setNewImages([]);
    setImagePreviews([]);
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from(TABLE_ITEMS)
        .select(
          `
          id, name, price, description, category_id, sizes, colors,
          item_images ( id, image_url ),
          categories ( id, name ),
          item_variants ( id, size, color, price, stock, sku )
        `
        )
        .order('id', { ascending: false });
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des produits :', err.message);
      setError('Erreur lors du chargement des produits.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase.from(TABLE_CATEGORIES).select('id, name').order('name');
    if (!error) setCategories(data || []);
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const addVariantRow = () => {
    setVariants(prev => [...prev, createEmptyVariant()]);
  };

  const updateVariantField = (index, field, value) => {
    setVariants(prev => prev.map((variant, idx) => (idx === index ? { ...variant, [field]: value } : variant)));
  };

  const removeVariantRow = index => {
    setVariants(prev => {
      if (prev.length === 1) return [createEmptyVariant()];
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const onFilesSelected = files => {
    const list = Array.from(files || []);
    if (!list.length) return;
    setNewImages(prev => [...prev, ...list]);
    const previews = list.map(f => URL.createObjectURL(f));
    setImagePreviews(prev => [...prev, ...previews]);
  };

  const onDrop = e => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    onFilesSelected(e.dataTransfer.files);
  };
  const onDragOver = e => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const onDragLeave = e => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const uploadImage = async (file, itemId) => {
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `${itemId}/${fileName}`;
    const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, file);
    if (uploadError) {
      console.error('Erreur upload image:', uploadError.message);
      return null;
    }
    const { data: publicData } = supabase.storage.from('product-images').getPublicUrl(filePath);
    const imageUrl = publicData?.publicUrl;
    if (!imageUrl) return null;
    const { error: dbError } = await supabase.from('item_images').insert([{ item_id: itemId, image_url: imageUrl }]);
    if (dbError) {
      console.error('Erreur enregistrement image:', dbError.message);
      return null;
    }
    return imageUrl;
  };

  const minVariantPrice = useMemo(() => {
    const prices = variants
      .map(v => parseFloat(String(v.price).replace(',', '.')))
      .filter(v => !Number.isNaN(v) && v >= 0);
    if (!prices.length) return null;
    return Math.min(...prices);
  }, [variants]);

  const validateVariants = () => {
    const errors = [];
    const combos = new Set();
    const cleaned = variants.map((variant, index) => {
      const size = sanitizeText(variant.size);
      const colorText = sanitizeText(variant.color);
      const color = colorText || null;
      const price = parseFloat(String(variant.price).replace(',', '.'));
      const stock = Math.max(0, parseInt(variant.stock, 10) || 0);

      if (!size) errors.push(`Variante #${index + 1}: la taille est requise.`);
      if (Number.isNaN(price)) errors.push(`Variante #${index + 1}: prix invalide.`);
      if (!Number.isNaN(price) && price < 0) errors.push(`Variante #${index + 1}: le prix doit être positif.`);

      const key = `${size}::${color || ''}`;
      if (size && !Number.isNaN(price)) {
        if (combos.has(key)) {
          errors.push(`Variante #${index + 1}: combinaison taille/couleur déjà utilisée.`);
        } else {
          combos.add(key);
        }
      }

      return {
        ...variant,
        size,
        color,
        price,
        stock,
        index,
      };
    });

    const valid = cleaned.filter(v => v.size && !Number.isNaN(v.price) && v.price >= 0);
    if (!valid.length) errors.push('Au moins une variante valide est requise.');

    return { errors, validVariants: valid };
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const trimmedName = sanitizeText(form.name);
      if (!trimmedName) {
        alert('Le nom du produit est requis.');
        return;
      }

      const { errors: variantErrors, validVariants } = validateVariants();
      if (variantErrors.length) {
        alert(variantErrors.join('\n'));
        return;
      }

      const minPrice = Math.min(...validVariants.map(v => v.price));
      const uniqueSizes = Array.from(new Set(validVariants.map(v => v.size))).sort();
      const uniqueColors = Array.from(new Set(validVariants.map(v => v.color).filter(Boolean))).sort();

      const itemPayload = {
        name: trimmedName,
        description: sanitizeText(form.description) || null,
        category_id: form.category_id ? Number(form.category_id) : null,
        price: minPrice,
        sizes: uniqueSizes,
        colors: uniqueColors,
      };

      let itemId = editingId;
      if (editingId) {
        const { error } = await supabase.from(TABLE_ITEMS).update(itemPayload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from(TABLE_ITEMS).insert([itemPayload]).select('id').single();
        if (error) throw error;
        itemId = data.id;
      }

      // Fetch existing variants to detect deletions
      const { data: existingVariants, error: existingError } = await supabase
        .from(TABLE_VARIANTS)
        .select('id')
        .eq('item_id', itemId);
      if (existingError) throw existingError;
      const existingIds = (existingVariants || []).map(v => v.id);

      const variantsPayload = validVariants.map((variant, idx) => {
        const payload = {
          item_id: itemId,
          size: variant.size,
          color: variant.color,
          price: variant.price,
          stock: variant.stock,
          sku: variant.sku || buildSku(itemId, variant),
        };
        if (variant.id) payload.id = variant.id;
        return payload;
      });

      const { error: upsertError } = await supabase
        .from(TABLE_VARIANTS)
        .upsert(variantsPayload, { onConflict: 'id' });
      if (upsertError) throw upsertError;

      const keepIds = variantsPayload.filter(v => v.id).map(v => v.id);
      const toDelete = existingIds.filter(id => !keepIds.includes(id));
      if (toDelete.length) {
        const { error: deleteError } = await supabase.from(TABLE_VARIANTS).delete().in('id', toDelete);
        if (deleteError) throw deleteError;
      }

      // Assure que le prix min est bien répercuté
      const { error: priceError } = await supabase
        .from(TABLE_ITEMS)
        .update({ price: minPrice, sizes: uniqueSizes, colors: uniqueColors })
        .eq('id', itemId);
      if (priceError) throw priceError;

      if (newImages.length) {
        await Promise.all(newImages.map(f => uploadImage(f, itemId)));
      }

      resetForm();
      fetchProducts();
    } catch (err) {
      console.error('Erreur sauvegarde produit:', err.message);
      alert("Erreur lors de l'enregistrement du produit.");
    }
  };

  const handleDelete = async id => {
    if (!confirm('Supprimer ce produit ?')) return;
    try {
      const { error } = await supabase.from(TABLE_ITEMS).delete().eq('id', id);
      if (error) throw error;
      fetchProducts();
    } catch (err) {
      console.error('Erreur lors de la suppression :', err.message);
      alert('Erreur lors de la suppression.');
    }
  };

  const handleEdit = async product => {
    setEditingId(product.id);
    setForm({
      name: product.name || '',
      description: product.description || '',
      category_id: product.category_id || '',
    });
    setNewImages([]);
    setImagePreviews([]);

    const { data, error } = await supabase
      .from(TABLE_VARIANTS)
      .select('id, size, color, price, stock, sku')
      .eq('item_id', product.id)
      .order('price', { ascending: true })
      .order('id', { ascending: true });

    if (!error) {
      const mapped = (data || []).map(v => ({
        id: v.id,
        size: v.size || '',
        color: v.color || '',
        price: v.price != null ? Number(v.price).toFixed(2) : '',
        stock: v.stock ?? 0,
        sku: v.sku || '',
      }));
      setVariants(mapped.length ? mapped : [createEmptyVariant()]);
    } else {
      console.error('Erreur chargement variantes:', error.message);
      setVariants([createEmptyVariant()]);
    }
  };

  const removeNewImage = idx => {
    setNewImages(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const deleteExistingImage = async (productId, image) => {
    try {
      const marker = '/product-images/';
      const idx = image.image_url.indexOf(marker);
      if (idx !== -1) {
        const path = image.image_url.substring(idx + marker.length);
        await supabase.storage.from('product-images').remove([path]);
      }
      await supabase.from('item_images').delete().eq('id', image.id);
      setProducts(prev =>
        prev.map(p =>
          p.id === productId
            ? { ...p, item_images: (p.item_images || []).filter(img => img.id !== image.id) }
            : p
        )
      );
    } catch (err) {
      console.error('Erreur suppression image:', err.message);
      alert("Impossible de supprimer l'image.");
    }
  };

  const categoryName = useMemo(() => {
    const map = new Map(categories.map(c => [c.id, c.name]));
    return id => map.get(id) || '—';
  }, [categories]);

  return (
    <div className="product-manager">
      <h2>Gestion des Produits</h2>

      <form onSubmit={handleSubmit} className="product-form" style={{ display: 'grid', gap: '10px' }}>
        <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: '1fr 180px' }}>
          <input name="name" value={form.name} onChange={handleChange} placeholder="Titre" required />
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: 12, color: '#4b5563' }}>Prix min (auto)</span>
            <strong>{minVariantPrice != null ? `${minVariantPrice.toFixed(2)} €` : '—'}</strong>
          </div>
        </div>

        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description"
        />

        <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: '1fr 1fr' }}>
          <select name="category_id" value={form.category_id || ''} onChange={handleChange}>
            <option value="">Catégorie...</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <section className="variant-editor" style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>Variantes</h3>
            <button type="button" onClick={addVariantRow} className="btn btn-outline">
              + Ajouter une variante
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="variant-table">
              <thead>
                <tr>
                  <th>Taille</th>
                  <th>Couleur</th>
                  <th>Prix (€)</th>
                  <th>Stock</th>
                  <th>SKU</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {variants.map((variant, index) => (
                  <tr key={variant.id ?? `new-${index}`}>
                    <td>
                      <input
                        value={variant.size}
                        onChange={e => updateVariantField(index, 'size', e.target.value)}
                        placeholder="Ex: S, M, L"
                        required
                      />
                    </td>
                    <td>
                      <input
                        value={variant.color}
                        onChange={e => updateVariantField(index, 'color', e.target.value)}
                        placeholder="Couleur"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        value={variant.price}
                        onChange={e => updateVariantField(index, 'price', e.target.value)}
                        placeholder="Prix"
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        value={variant.stock}
                        onChange={e => updateVariantField(index, 'stock', e.target.value)}
                        placeholder="Stock"
                      />
                    </td>
                    <td>{variant.sku || 'Auto'}</td>
                    <td>
                      <button type="button" onClick={() => removeVariantRow(index)} className="btn btn-outline">
                        Retirer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          style={{
            border: '2px dashed #cbd5e1',
            borderRadius: 10,
            padding: 16,
            background: isDragging ? '#f9fafb' : 'transparent',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
            <span>Images: glisser-déposer des fichiers ou</span>
            <label className="btn btn-outline">
              Choisir
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={e => onFilesSelected(e.target.files)}
                style={{ display: 'none' }}
              />
            </label>
          </div>
          {(imagePreviews.length > 0 || newImages.length > 0) && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
              {imagePreviews.map((src, idx) => (
                <div key={idx} style={{ position: 'relative' }}>
                  <img src={src} alt="nouvelle" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} />
                  <button
                    type="button"
                    onClick={() => removeNewImage(idx)}
                    style={{ position: 'absolute', top: 2, right: 2 }}
                    aria-label="Supprimer l’aperçu"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="btn-group">
          <button type="submit" className="btn btn-primary">
            {editingId ? 'Mettre à jour' : 'Ajouter'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="btn btn-outline">
              Annuler
            </button>
          )}
        </div>
      </form>

      {loading && <p>Chargement en cours...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && products.length === 0 && <p className="empty-state">Aucun produit disponible.</p>}

      {products.length > 0 && (
        <div style={{ overflowX: 'auto', marginTop: 16 }}>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Image</th>
                <th>Titre</th>
                <th>Prix (min)</th>
                <th>Catégorie</th>
                <th>Variantes</th>
                <th>Images</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>
                    {p.item_images?.[0]?.image_url ? (
                      <img
                        src={p.item_images[0].image_url}
                        alt={p.name}
                        style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }}
                      />
                    ) : (
                      <span style={{ color: '#9ca3af' }}>—</span>
                    )}
                  </td>
                  <td>{p.name}</td>
                  <td>{Number(p.price).toFixed(2)}€</td>
                  <td>{categoryName(p.category_id)}</td>
                  <td>
                    {(p.item_variants || []).length ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {p.item_variants.slice(0, 3).map(v => (
                          <span key={v.id}>
                            {v.size}
                            {v.color ? ` / ${v.color}` : ''} — {Number(v.price).toFixed(2)}€
                          </span>
                        ))}
                        {p.item_variants.length > 3 && <span>… (+{p.item_variants.length - 3})</span>}
                      </div>
                    ) : (
                      <span style={{ color: '#9ca3af' }}>—</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {(p.item_images || []).map(img => (
                        <div key={img.id} style={{ position: 'relative' }}>
                          <img
                            src={img.image_url}
                            alt="img"
                            style={{ width: 42, height: 42, objectFit: 'cover', borderRadius: 6 }}
                          />
                          <button
                            type="button"
                            onClick={() => deleteExistingImage(p.id, img)}
                            title="Supprimer"
                            style={{ position: 'absolute', top: -6, right: -6, fontSize: 12 }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className="btn-group">
                      <button onClick={() => handleEdit(p)} className="btn btn-outline">
                        Modifier
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="btn btn-danger">
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
