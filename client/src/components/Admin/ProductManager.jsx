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
  syncItemColors,
  upsertVariants,
  uploadProductImage,
} from '../../services/adminProducts';
import { listColors } from '@/services/adminColors';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { pushToast } from '../ToastHost';
import { supabase } from '@/supabase/supabaseClient';

export const TABLE_ITEMS = 'items';
const TABLE_CATEGORIES = 'categories';
const TABLE_VARIANTS = 'item_variants';
const PRODUCT_DRAFT_KEY = 'admin-product-draft';

const createEmptyVariant = () => ({
  id: null,
  size: '',
  color_id: '',
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
  const colorSlug = slugify(variant.color_label || '') || 'def';
  return `SKU-${itemId}-${sizeSlug}-${colorSlug}-${randomSuffix()}`.toUpperCase();
};

export default function ProductAdmin() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    category_id: '',
    status: 'active',
  });

  const [variants, setVariants] = useState([createEmptyVariant()]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [newImages, setNewImages] = useState([]); // File[]
  const [imagePreviews, setImagePreviews] = useState([]); // local URL previews
  const [isDirty, setIsDirty] = useState(false);

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      category_id: '',
      status: 'active',
    });
    setVariants([createEmptyVariant()]);
    setSelectedColors([]);
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
      if (error) {
        // Fallback sans relation item_colors si la table n'est pas connue du schéma
        if (String(error.message || '').includes('item_colors')) {
          const { data: fallbackData, error: fbError } = await supabase
            .from(TABLE_ITEMS)
            .select(`
              id, name, price, description, category_id, status,
              item_images ( id, image_url ),
              categories ( id, name ),
              item_variants ( id, size, color_id, price, stock, sku )
            `)
            .order('id', { ascending: false });
          if (fbError) throw fbError;
          setProducts(fallbackData || []);
          return;
        }
        throw error;
      }
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

  const fetchColors = async () => {
    const { data, error } = await listColors();
    if (!error) setColors(data || []);
  };

  useEffect(() => {
    fetchProducts();
    fetchCategoriesList();
    fetchColors();
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
          status: draft.form?.status || 'active',
        });
        const draftVariants = Array.isArray(draft.variants) && draft.variants.length
          ? draft.variants.map(v => ({
              id: null,
              size: v.size || '',
              color_id: v.color_id || '',
              price: v.price || '',
              stock: v.stock ?? 0,
              sku: v.sku || '',
            }))
          : [createEmptyVariant()];
        setVariants(draftVariants);
        setSelectedColors(Array.isArray(draft.selectedColors) ? draft.selectedColors : []);
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
        color_id: v.color_id,
        price: v.price,
        stock: v.stock,
        sku: v.sku,
      })),
      selectedColors,
    };
    localStorage.setItem(PRODUCT_DRAFT_KEY, JSON.stringify(payload));
  }, [form, variants, selectedColors, isDirty, editingId]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setIsDirty(true);
  };

  const addVariantRow = () => {
    setVariants(prev => [...prev, createEmptyVariant()]);
    setIsDirty(true);
  };

  const toggleColor = colorId => {
    setSelectedColors(prev => {
      const idNum = Number(colorId);
      const exists = prev.includes(idNum);
      const next = exists ? prev.filter(id => id !== idNum) : [...prev, idNum];
      return next;
    });
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
      const colorId = variant.color_id ? Number(variant.color_id) : null;
      const colorObj = colorId ? colors.find(c => c.id === colorId) : null;
      const colorLabel = colorObj?.name || '';
      const price = parseFloat(String(variant.price).replace(',', '.'));
      const stock = Math.max(0, parseInt(variant.stock, 10) || 0);

      if (!size) errors.push(`Variante #${index + 1}: la taille est requise.`);
      if (Number.isNaN(price)) errors.push(`Variante #${index + 1}: prix invalide.`);
      if (!Number.isNaN(price) && price < 0) errors.push(`Variante #${index + 1}: le prix doit être positif.`);

      const key = `${size}`;
      if (size && !Number.isNaN(price)) {
        if (combos.has(key)) {
          errors.push(`Variante #${index + 1}: la taille est déjà utilisée.`);
        } else {
          combos.add(key);
        }
      }

      return {
        ...variant,
        size,
        color_id: colorId,
        color_label: colorLabel,
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

      const normalizedColorIds = colors.length
        ? Array.from(new Set(selectedColors.map(id => Number(id)))).filter(Boolean)
        : [];
      if (colors.length && !normalizedColorIds.length) {
        alert('Sélectionne au moins une couleur pour ce produit.');
        return;
      }

      const { errors: variantErrors, validVariants } = validateVariants();
      if (variantErrors.length) {
        alert(variantErrors.join('\n'));
        return;
      }

      const minPrice = Math.min(...validVariants.map(v => v.price));

      const itemPayload = {
        name: trimmedName,
        description: sanitizeText(form.description) || null,
        category_id: form.category_id ? Number(form.category_id) : null,
        price: minPrice,
      };

      let itemId = editingId;
      if (editingId) {
        const { error } = await upsertItem(itemPayload, editingId);
        if (error) throw error;
        if (normalizedColorIds.length) {
          const { error: colorsError } = await syncItemColors(editingId, normalizedColorIds);
          if (colorsError) {
            if (String(colorsError.message || '').includes('item_colors')) {
              pushToast({ message: 'Couleurs non synchronisées (table absente ?)', variant: 'error' });
            } else {
              throw colorsError;
            }
          }
        }
      } else {
        const { data, error } = await upsertItem(itemPayload, null);
        if (error) throw error;
        itemId = data.id;
        if (normalizedColorIds.length) {
          const { error: colorsError } = await syncItemColors(itemId, normalizedColorIds);
          if (colorsError) {
            if (String(colorsError.message || '').includes('item_colors')) {
              pushToast({ message: 'Couleurs non synchronisées (table absente ?)', variant: 'error' });
            } else {
              throw colorsError;
            }
          }
        }
        // Si aucune couleur dispo dans le schéma, on continue sans bloquer
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
          color_id: variant.color_id,
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
      const { error: priceError } = await updateItemPriceMeta(itemId, minPrice);
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
      status: product.status || 'active',
    });
    setSelectedColors(
      (product.item_colors || [])
        .map(ic => ic.color_id || ic.colors?.id)
        .filter(Boolean)
        .map(Number)
    );
    setNewImages([]);
    setImagePreviews([]);
    setIsDirty(false);
    localStorage.removeItem(PRODUCT_DRAFT_KEY);

    const { data, error } = await fetchVariantsByItem(product.id);

    if (!error) {
      const mapped = (data || []).map(v => ({
        id: v.id,
        size: v.size || '',
        color_id: v.color_id || '',
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

  const categoryTree = useMemo(() => {
    const parents = [];
    const children = new Map();
    const byId = new Map();

    categories.forEach(cat => {
      byId.set(cat.id, cat);
      if (!cat.parent_id) {
        parents.push(cat);
        return;
      }
      const arr = children.get(cat.parent_id) || [];
      arr.push(cat);
      children.set(cat.parent_id, arr);
    });

    parents.sort((a, b) => a.name.localeCompare(b.name));
    children.forEach(arr => arr.sort((a, b) => a.name.localeCompare(b.name)));

    return { parents, children, byId };
  }, [categories]);

  const { groupedCategories, orphanCategories } = useMemo(() => {
    const seen = new Set();
    const groups = categoryTree.parents.map(parent => {
      const subs = categoryTree.children.get(parent.id) || [];
      seen.add(parent.id);
      subs.forEach(s => seen.add(s.id));
      return { parent, children: subs };
    });
    const orphans = categories.filter(cat => !seen.has(cat.id));
    return { groupedCategories: groups, orphanCategories: orphans };
  }, [categoryTree, categories]);

  const categoryName = useMemo(() => {
    const byId = categoryTree.byId;
    return id => {
      const cat = byId.get(id);
      if (!cat) return '—';
      const parent = cat.parent_id ? byId.get(cat.parent_id) || cat.parent : null;
      return parent ? `${parent.name} › ${cat.name}` : cat.name;
    };
  }, [categoryTree]);

  const colorById = useMemo(() => {
    const map = new Map(colors.map(c => [c.id, c]));
    return id => map.get(id) || null;
  }, [colors]);

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
              {groupedCategories.map(group => (
                <optgroup key={group.parent.id} label={group.parent.name}>
                  <option value={group.parent.id}>{group.parent.name} — toutes</option>
                  {group.children.map(sub => (
                    <option key={sub.id} value={sub.id}>
                      {group.parent.name} › {sub.name}
                    </option>
                  ))}
                </optgroup>
              ))}
              {orphanCategories.length > 0 && (
                <optgroup label="Autres">
                  {orphanCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {categoryName(cat.id)}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
        </div>

        <section className="color-selector">
          <div className="variant-editor__header">
            <h3>Couleurs du produit</h3>
            <p className="input-hint">Sélectionne une ou plusieurs couleurs disponibles.</p>
          </div>
          <div className="color-select-grid">
            {colors.length === 0 && <p className="input-hint">Aucune couleur disponible. Crée-les dans l’onglet Couleurs.</p>}
            {colors.map(color => {
              const checked = selectedColors.includes(color.id);
              return (
                <label
                  key={color.id}
                  className={`color-pill ${checked ? 'is-selected' : ''}`}
                  title={color.name}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleColor(color.id)}
                    aria-label={color.name}
                  />
                  <span className="color-swatch" style={{ backgroundColor: color.hex_code }} aria-hidden="true" />
                  <span>{color.name}</span>
                </label>
              );
            })}
          </div>
        </section>

        <section className="variant-editor">
          <div className="variant-editor__header">
            <h3>Variantes</h3>
            <button type="button" onClick={addVariantRow} className="btn btn-outline">
              + Ajouter une variante
            </button>
          </div>
          <div className="variant-palette">
            {colors.length === 0 ? (
              <p className="input-hint">Aucune couleur disponible. Ajoutez-en dans l’onglet Couleurs.</p>
            ) : (
              colors.map(c => (
                <span key={c.id} className="color-chip">
                  <span className="color-swatch" style={{ backgroundColor: c.hex_code }} aria-hidden="true" />
                  {c.name}
                </span>
              ))
            )}
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
                      <div className="color-select-cell">
                        <select
                          value={variant.color_id || ''}
                          onChange={e => updateVariantField(index, 'color_id', e.target.value)}
                          disabled={!colors.length}
                        >
                          <option value="">Couleur...</option>
                          {colors.map(color => (
                            <option key={color.id} value={color.id}>
                              {color.name}
                            </option>
                          ))}
                        </select>
                        {variant.color_id && (
                          <span
                            className="color-swatch"
                            style={{
                              backgroundColor: colorById(Number(variant.color_id))?.hex_code || '#ccc',
                              width: 24,
                              height: 24,
                            }}
                            title={colorById(Number(variant.color_id))?.name || ''}
                          />
                        )}
                      </div>
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
                        {p.item_variants.slice(0, 3).map(v => {
                          const col = colorById(v.color_id);
                          return (
                            <span key={v.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              {v.size} / {col?.name || '—'}
                              {col?.hex_code && (
                                <span
                                  className="color-swatch"
                                  style={{ backgroundColor: col.hex_code, width: 14, height: 14 }}
                                />
                              )}{' '}
                              — {Number(v.price).toFixed(2)}€
                            </span>
                          );
                        })}
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
