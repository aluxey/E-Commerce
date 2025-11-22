import { useEffect, useMemo, useState } from 'react';
import {
  deleteItem,
  deleteItemImage,
  deleteVariants,
  fetchVariantsByItem,
  getPublicImageUrl,
  insertItemImage,
  insertVariants,
  listCategories,
  listProducts,
  removeProductImage,
  updateItemPriceMeta,
  upsertItem,
  upsertVariants,
  uploadProductImage,
} from '../../services/adminProducts';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { pushToast } from '../ToastHost';

export const TABLE_ITEMS = 'items';
const TABLE_CATEGORIES = 'categories';
const TABLE_VARIANTS = 'item_variants';
const PRODUCT_DRAFT_KEY = 'admin-product-draft';

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
  const [isDirty, setIsDirty] = useState(false);

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
    setIsDirty(false);
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await listProducts();
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

  const fetchCategoriesList = async () => {
    const { data, error } = await listCategories();
    if (!error) setCategories(data || []);
  };

  useEffect(() => {
    fetchProducts();
    fetchCategoriesList();
  }, []);

  useUnsavedChanges(isDirty, 'Des modifications produit ne sont pas sauvegardées. Quitter la page ?');

  // Charger un brouillon si on n'est pas en mode édition
  useEffect(() => {
    if (editingId) return;
    const raw = localStorage.getItem(PRODUCT_DRAFT_KEY);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw);
      if (draft && typeof draft === 'object') {
        setForm({
          name: draft.form?.name || '',
          description: draft.form?.description || '',
          category_id: draft.form?.category_id || '',
        });
        const draftVariants = Array.isArray(draft.variants) && draft.variants.length
          ? draft.variants.map(v => ({
              id: null,
              size: v.size || '',
              color: v.color || '',
              price: v.price || '',
              stock: v.stock ?? 0,
              sku: v.sku || '',
            }))
          : [createEmptyVariant()];
        setVariants(draftVariants);
        setIsDirty(true);
      }
    } catch (err) {
      console.warn('Impossible de charger le brouillon produit', err);
    }
  }, [editingId]);

  // Sauvegarde du brouillon (uniquement pour un nouveau produit)
  useEffect(() => {
    if (!isDirty || editingId) return;
    const payload = {
      form,
      variants: variants.map(v => ({
        size: v.size,
        color: v.color,
        price: v.price,
        stock: v.stock,
        sku: v.sku,
      })),
    };
    localStorage.setItem(PRODUCT_DRAFT_KEY, JSON.stringify(payload));
  }, [form, variants, isDirty, editingId]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setIsDirty(true);
  };

  const addVariantRow = () => {
    setVariants(prev => [...prev, createEmptyVariant()]);
    setIsDirty(true);
  };

  const updateVariantField = (index, field, value) => {
    setVariants(prev => prev.map((variant, idx) => (idx === index ? { ...variant, [field]: value } : variant)));
    setIsDirty(true);
  };

  const removeVariantRow = index => {
    setVariants(prev => {
      if (prev.length === 1) return [createEmptyVariant()];
      return prev.filter((_, idx) => idx !== index);
    });
    setIsDirty(true);
  };

  const onFilesSelected = files => {
    const list = Array.from(files || []);
    if (!list.length) return;
    setNewImages(prev => [...prev, ...list]);
    const previews = list.map(f => URL.createObjectURL(f));
    setImagePreviews(prev => [...prev, ...previews]);
    setIsDirty(true);
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
        const { error } = await upsertItem(itemPayload, editingId);
        if (error) throw error;
      } else {
        const { data, error } = await upsertItem(itemPayload, null);
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

      const variantsPayload = validVariants.map(variant => {
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

      const variantsToUpdate = variantsPayload.filter(v => v.id);
      /* eslint-disable no-unused-vars */
      const variantsToInsert = variantsPayload
        .filter(v => !v.id)
        // Drop `id` if present to avoid conflicts on insert
        .map(({ id, ...rest }) => rest);
      /* eslint-enable no-unused-vars */

      if (variantsToUpdate.length) {
        const { error: updateError } = await upsertVariants(variantsToUpdate);
        if (updateError) throw updateError;
      }

      if (variantsToInsert.length) {
        const { error: insertError } = await insertVariants(variantsToInsert);
        if (insertError) throw insertError;
      }

      const keepIds = variantsToUpdate.map(v => v.id);
      const toDelete = existingIds.filter(id => !keepIds.includes(id));
      if (toDelete.length) {
        const { error: deleteError } = await deleteVariants(toDelete);
        if (deleteError) throw deleteError;
      }

      // Assure que le prix min est bien répercuté
      const { error: priceError } = await updateItemPriceMeta(itemId, minPrice, uniqueSizes, uniqueColors);
      if (priceError) throw priceError;

      if (newImages.length) {
        await Promise.all(newImages.map(f => uploadImage(f, itemId)));
      }

      resetForm();
      fetchProducts();
      pushToast({ message: editingId ? 'Produit mis à jour' : 'Produit créé', variant: 'success' });
      localStorage.removeItem(PRODUCT_DRAFT_KEY);
    } catch (err) {
      console.error('Erreur sauvegarde produit:', err.message);
      pushToast({ message: "Erreur lors de l'enregistrement du produit.", variant: 'error' });
    }
  };

  const handleDelete = async id => {
    if (!confirm('Supprimer ce produit ?')) return;
    try {
      const { error } = await deleteItem(id);
      if (error) throw error;
      fetchProducts();
      pushToast({ message: 'Produit supprimé', variant: 'success' });
    } catch (err) {
      console.error('Erreur lors de la suppression :', err.message);
      pushToast({ message: 'Erreur lors de la suppression.', variant: 'error' });
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
    setIsDirty(false);
    localStorage.removeItem(PRODUCT_DRAFT_KEY);

    const { data, error } = await fetchVariantsByItem(product.id);

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
    setIsDirty(false);
    localStorage.removeItem(PRODUCT_DRAFT_KEY);
  };

  const removeNewImage = idx => {
    setNewImages(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
    setIsDirty(true);
  };

  const deleteExistingImage = async (productId, image) => {
    try {
      const marker = '/product-images/';
      const idx = image.image_url.indexOf(marker);
      if (idx !== -1) {
        const path = image.image_url.substring(idx + marker.length);
        await removeProductImage(path);
      }
      await deleteItemImage(image.id);
      setProducts(prev =>
        prev.map(p =>
          p.id === productId
            ? { ...p, item_images: (p.item_images || []).filter(img => img.id !== image.id) }
            : p
        )
      );
      pushToast({ message: 'Image supprimée', variant: 'info' });
    } catch (err) {
      console.error('Erreur suppression image:', err.message);
      pushToast({ message: "Impossible de supprimer l'image.", variant: 'error' });
    }
  };

  const categoryName = useMemo(() => {
    const map = new Map(categories.map(c => [c.id, c.name]));
    return id => map.get(id) || '—';
  }, [categories]);

  return (
    <div className="product-manager">
      <h2>Gestion des Produits</h2>

      <form onSubmit={handleSubmit} className="product-form form-grid">
        <div className="form-row two-col">
          <div className="form-group">
            <label>Nom du produit *</label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="Titre" required />
          </div>
          <div className="form-group">
            <label>Prix min (auto)</label>
            <div className="pill-display">{minVariantPrice != null ? `${minVariantPrice.toFixed(2)} €` : '—'}</div>
          </div>
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Description"
          />
        </div>

        <div className="form-row two-col">
          <div className="form-group">
            <label>Catégorie</label>
            <select name="category_id" value={form.category_id || ''} onChange={handleChange}>
              <option value="">Catégorie...</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <section className="variant-editor">
          <div className="variant-editor__header">
            <h3>Variantes</h3>
            <button type="button" onClick={addVariantRow} className="btn btn-outline">
              + Ajouter une variante
            </button>
          </div>
          <div className="variant-table-wrapper">
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
          className={`upload-dropzone${isDragging ? ' is-dragging' : ''}`}
        >
          <div className="upload-cta">
            <span>Images: glisser-déposer des fichiers ou</span>
            <label className="btn btn-outline" htmlFor="file-input">
              Choisir
            </label>
            <input
              id="file-input"
              type="file"
              accept="image/*"
              multiple
              onChange={e => onFilesSelected(e.target.files)}
              style={{ display: 'none' }}
            />
          </div>
          {(imagePreviews.length > 0 || newImages.length > 0) && (
            <div className="upload-previews">
              {imagePreviews.map((src, idx) => (
                <div key={idx} className="upload-preview">
                  <img src={src} alt="nouvelle" />
                  <button
                    type="button"
                    onClick={() => removeNewImage(idx)}
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
      {error && <p className="error-msg">{error}</p>}

      {!loading && products.length === 0 && <p className="empty-state">Aucun produit disponible.</p>}

      {products.length > 0 && (
        <div className="variant-table-wrapper">
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
                      <span style={{ color: 'color-mix(in oklab, var(--adm-muted) 65%, transparent)' }}>—</span>
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
                      <span style={{ color: 'color-mix(in oklab, var(--adm-muted) 65%, transparent)' }}>—</span>
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
