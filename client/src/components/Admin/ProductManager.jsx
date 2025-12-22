import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { listColors } from '@/services/adminColors';
import { supabase } from '@/supabase/supabaseClient';
import { useEffect, useMemo, useState } from 'react';
import {
  createItemWithColors,
  deleteItem,
  deleteItemImage,
  deleteVariants,
  fetchVariantsByItem,
  insertVariants,
  listCategories,
  listProducts,
  removeProductImage,
  reorderItemImages,
  syncItemColors,
  updateItemPriceMeta,
  upsertItem,
  upsertVariants
} from '../../services/adminProducts';
import { pushToast } from '../ToastHost';

export const TABLE_ITEMS = 'items';
const TABLE_VARIANTS = 'item_variants';
const PRODUCT_DRAFT_KEY = 'admin-product-draft';

// Tailles prédéfinies communes
const PRESET_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Unique'];

const createEmptyVariant = () => ({
  id: null,
  size: '',
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
  return `SKU-${itemId}-${sizeSlug}-${randomSuffix()}`.toUpperCase();
};

// Wizard Steps
const STEPS = {
  INFO: 0,
  COLORS: 1,
  VARIANTS: 2,
  IMAGES: 3,
  REVIEW: 4
};

const STEP_LABELS = ['Informations', 'Couleurs', 'Variantes', 'Images', 'Résumé'];

export default function ProductManager() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [currentStep, setCurrentStep] = useState(STEPS.INFO);
  const [showWizard, setShowWizard] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    category_id: '',
    status: 'active',
  });

  const [variants, setVariants] = useState([createEmptyVariant()]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [basePrice, setBasePrice] = useState('');
  const [baseStock, setBaseStock] = useState(10);
  const [newImages, setNewImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);
  const [isDirty, setIsDirty] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      category_id: '',
      status: 'active',
    });
    setVariants([createEmptyVariant()]);
    setSelectedColors([]);
    setSelectedSizes([]);
    setBasePrice('');
    setBaseStock(10);
    setEditingId(null);
    setNewImages([]);
    setImagePreviews([]);
    setExistingImages([]);
    setPrimaryImageIndex(0);
    setIsDirty(false);
    setCurrentStep(STEPS.INFO);
    setShowWizard(false);
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await listProducts();
      if (error) {
        if (String(error.message || '').includes('item_colors')) {
          const { data: fallbackData, error: fbError } = await supabase
            .from(TABLE_ITEMS)
            .select(`
              id, name, price, description, category_id, status,
              item_images ( id, image_url ),
              categories ( id, name ),
              item_variants ( id, size, price, stock, sku )
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
              price: v.price || '',
              stock: v.stock ?? 0,
              sku: v.sku || '',
            }))
          : [createEmptyVariant()];
        setVariants(draftVariants);
        setSelectedColors(Array.isArray(draft.selectedColors) ? draft.selectedColors : []);
        setSelectedSizes(Array.isArray(draft.selectedSizes) ? draft.selectedSizes : []);
        setBasePrice(draft.basePrice || '');
        setBaseStock(draft.baseStock ?? 10);
        setIsDirty(true);
      }
    } catch (err) {
      console.warn('Impossible de charger le brouillon produit', err);
    }
  }, [editingId]);

  // Sauvegarde du brouillon
  useEffect(() => {
    if (!isDirty || editingId) return;
    const payload = {
      form,
      variants: variants.map(v => ({
        size: v.size,
        price: v.price,
        stock: v.stock,
        sku: v.sku,
      })),
      selectedColors,
      selectedSizes,
      basePrice,
      baseStock,
    };
    localStorage.setItem(PRODUCT_DRAFT_KEY, JSON.stringify(payload));
  }, [form, variants, selectedColors, selectedSizes, basePrice, baseStock, isDirty, editingId]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setIsDirty(true);
  };

  // Toggle taille prédéfinie
  const toggleSize = size => {
    setSelectedSizes(prev => {
      const exists = prev.includes(size);
      return exists ? prev.filter(s => s !== size) : [...prev, size];
    });
    setIsDirty(true);
  };

  // Génération automatique de variantes
  const generateVariants = () => {
    if (!selectedSizes.length) {
      pushToast({ message: 'Sélectionnez au moins une taille', variant: 'warning' });
      return;
    }

    const price = parseFloat(String(basePrice).replace(',', '.'));
    if (Number.isNaN(price) || price < 0) {
      pushToast({ message: 'Définissez un prix de base valide', variant: 'warning' });
      return;
    }

    const newVariants = selectedSizes.map(size => ({
      id: null,
      size,
      price: price.toFixed(2),
      stock: baseStock,
      sku: '',
    }));

    setVariants(newVariants);
    setIsDirty(true);
    pushToast({ message: `${newVariants.length} variantes générées`, variant: 'success' });
  };

  const addVariantRow = () => {
    setVariants(prev => [...prev, createEmptyVariant()]);
    setIsDirty(true);
  };

  const toggleColor = colorId => {
    setSelectedColors(prev => {
      const idNum = Number(colorId);
      const exists = prev.includes(idNum);
      return exists ? prev.filter(id => id !== idNum) : [...prev, idNum];
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
      const price = parseFloat(String(variant.price).replace(',', '.'));
      const stock = Math.max(0, parseInt(variant.stock, 10) || 0);

      if (!size) errors.push(`Variante #${index + 1}: la taille est requise.`);
      if (Number.isNaN(price)) errors.push(`Variante #${index + 1}: prix invalide.`);
      if (!Number.isNaN(price) && price < 0) errors.push(`Variante #${index + 1}: le prix doit être positif.`);

      const key = size || '—';
      if (size && !Number.isNaN(price)) {
        if (combos.has(key)) {
          errors.push(`Variante #${index + 1}: cette taille existe déjà.`);
        } else {
          combos.add(key);
        }
      }

      return {
        ...variant,
        size,
        price,
        stock,
        index,
      };
    });

    const valid = cleaned.filter(v => v.size && !Number.isNaN(v.price) && v.price >= 0);
    if (!valid.length) errors.push('Au moins une variante valide est requise.');

    return { errors, validVariants: valid };
  };

  // Navigation wizard
  const canProceed = step => {
    switch (step) {
      case STEPS.INFO:
        return sanitizeText(form.name).length > 0;
      case STEPS.COLORS:
        return selectedColors.length > 0 || colors.length === 0;
      case STEPS.VARIANTS:
        return variants.some(v => v.size && v.price);
      case STEPS.IMAGES:
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (currentStep < STEPS.REVIEW && canProceed(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > STEPS.INFO) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const goToStep = step => {
    if (step <= currentStep || canProceed(currentStep)) {
      setCurrentStep(step);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const trimmedName = sanitizeText(form.name);
      if (!trimmedName) {
        pushToast({ message: 'Le nom du produit est requis.', variant: 'error' });
        return;
      }

      const normalizedColorIds = colors.length
        ? Array.from(new Set(selectedColors.map(id => Number(id)))).filter(Boolean)
        : [];

      const { errors: variantErrors, validVariants } = validateVariants();
      if (variantErrors.length) {
        pushToast({ message: variantErrors[0], variant: 'error' });
        return;
      }

      const minPrice = Math.min(...validVariants.map(v => v.price));

      const itemPayload = {
        name: trimmedName,
        description: sanitizeText(form.description) || null,
        category_id: form.category_id ? Number(form.category_id) : null,
        price: minPrice,
        status: form.status,
      };

      let itemId = editingId;
      if (editingId) {
        const { error } = await upsertItem(itemPayload, editingId);
        if (error) throw error;
        if (normalizedColorIds.length) {
          const { error: colorsError } = await syncItemColors(editingId, normalizedColorIds);
          if (colorsError && !String(colorsError.message || '').includes('item_colors')) {
            throw colorsError;
          }
        }
      } else {
        const { data, error } = await createItemWithColors(itemPayload, normalizedColorIds);
        if (error) throw error;
        itemId = data.id;
      }

      // Fetch existing variants
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
          price: variant.price,
          stock: variant.stock,
          sku: variant.sku || buildSku(itemId, variant),
        };
        if (variant.id) payload.id = variant.id;
        return payload;
      });

      const variantsToUpdate = variantsPayload.filter(v => v.id);
      const variantsToInsert = variantsPayload
        .filter(v => !v.id)
        .map(({ id, ...rest }) => rest);

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

      const { error: priceError } = await updateItemPriceMeta(itemId, minPrice);
      if (priceError) throw priceError;

      // Handle image reordering and upload
      const existingCount = existingImages.length;
      const primaryIsNew = primaryImageIndex >= existingCount;

      // If primary is an existing image and it's not the first one, reorder
      if (existingCount > 1 && !primaryIsNew && primaryImageIndex > 0) {
        // Reorder existing images so primary comes first
        const reorderedIds = [
          existingImages[primaryImageIndex].id,
          ...existingImages.filter((_, i) => i !== primaryImageIndex).map(img => img.id)
        ];
        const { error: reorderError } = await reorderItemImages(itemId, reorderedIds);
        if (reorderError) {
          console.warn('Could not reorder images:', reorderError);
        }
      }

      // Upload new images
      if (newImages.length > 0) {
        if (primaryIsNew && existingCount === 0) {
          // No existing images, primary is a new image - upload in correct order
          const primaryNewIdx = primaryImageIndex - existingCount;
          const reorderedImages = [
            newImages[primaryNewIdx],
            ...newImages.filter((_, i) => i !== primaryNewIdx)
          ];
          for (const file of reorderedImages) {
            await uploadImage(file, itemId);
          }
        } else {
          // Has existing images or primary is existing - just upload new ones in order
          for (const file of newImages) {
            await uploadImage(file, itemId);
          }
        }
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
    // Load existing images
    const productImages = product.item_images || [];
    setExistingImages(productImages);
    setPrimaryImageIndex(0);
    setNewImages([]);
    setImagePreviews([]);
    setIsDirty(false);
    localStorage.removeItem(PRODUCT_DRAFT_KEY);

    const { data, error } = await fetchVariantsByItem(product.id);

    if (!error) {
      const mapped = (data || []).map(v => ({
        id: v.id,
        size: v.size || '',
        price: v.price != null ? Number(v.price).toFixed(2) : '',
        stock: v.stock ?? 0,
        sku: v.sku || '',
      }));
      setVariants(mapped.length ? mapped : [createEmptyVariant()]);

      // Extraire les tailles uniques
      const sizes = [...new Set(mapped.map(v => v.size).filter(Boolean))];
      setSelectedSizes(sizes);
    } else {
      setVariants([createEmptyVariant()]);
    }

    setCurrentStep(STEPS.INFO);
    setShowWizard(true);
    setIsDirty(false);
  };

  const removeNewImage = idx => {
    const existingCount = existingImages.length;
    // Adjust primary index if needed
    if (primaryImageIndex === existingCount + idx) {
      setPrimaryImageIndex(0);
    } else if (primaryImageIndex > existingCount + idx) {
      setPrimaryImageIndex(prev => prev - 1);
    }
    setNewImages(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
    setIsDirty(true);
  };

  const removeExistingImage = async (idx) => {
    const image = existingImages[idx];
    if (!image) return;

    try {
      // Delete from storage
      const marker = '/product-images/';
      const urlIdx = image.image_url.indexOf(marker);
      if (urlIdx !== -1) {
        const path = image.image_url.substring(urlIdx + marker.length);
        await removeProductImage(path);
      }
      // Delete from database
      await deleteItemImage(image.id);

      // Update local state
      setExistingImages(prev => prev.filter((_, i) => i !== idx));

      // Adjust primary index if needed
      if (primaryImageIndex === idx) {
        setPrimaryImageIndex(0);
      } else if (primaryImageIndex > idx) {
        setPrimaryImageIndex(prev => prev - 1);
      }

      // Update products list
      if (editingId) {
        setProducts(prev =>
          prev.map(p =>
            p.id === editingId
              ? { ...p, item_images: (p.item_images || []).filter(img => img.id !== image.id) }
              : p
          )
        );
      }

      pushToast({ message: 'Image supprimée', variant: 'success' });
    } catch (err) {
      console.error('Erreur suppression image:', err.message);
      pushToast({ message: "Impossible de supprimer l'image.", variant: 'error' });
    }
  };

  const setAsPrimary = (type, idx) => {
    const existingCount = existingImages.length;
    const newIndex = type === 'existing' ? idx : existingCount + idx;
    setPrimaryImageIndex(newIndex);
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

  // Produits filtrés
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.id?.toString().includes(q)
    );
  }, [products, searchQuery]);

  // Render des étapes du wizard
  const renderStepContent = () => {
    switch (currentStep) {
      case STEPS.INFO:
        return (
          <div className="wizard-step">
            <div className="step-header">
              <h3>📝 Informations de base</h3>
              <p className="step-description">Commençons par les informations essentielles de votre produit.</p>
            </div>

            <div className="form-grid">
              <div className="form-group form-group--full">
                <label>Nom du produit <span className="required">*</span></label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ex: Panier tressé coton bio"
                  className="input-lg"
                  required
                />
              </div>

              <div className="form-row two-col">
                <div className="form-group">
                  <label>Catégorie</label>
                  <select name="category_id" value={form.category_id || ''} onChange={handleChange}>
                    <option value="">Choisir une catégorie...</option>
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

                <div className="form-group">
                  <label>Statut</label>
                  <select name="status" value={form.status} onChange={handleChange}>
                    <option value="active">✅ Actif (visible)</option>
                    <option value="draft">📝 Brouillon</option>
                    <option value="archived">📦 Archivé</option>
                  </select>
                </div>
              </div>

              <div className="form-group form-group--full">
                <label>Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Décrivez votre produit en quelques phrases..."
                  rows={4}
                />
              </div>
            </div>
          </div>
        );

      case STEPS.COLORS:
        return (
          <div className="wizard-step">
            <div className="step-header">
              <h3>🎨 Couleurs disponibles</h3>
              <p className="step-description">Sélectionnez les couleurs dans lesquelles ce produit est disponible.</p>
            </div>

            {colors.length === 0 ? (
              <div className="empty-state-inline">
                <span className="empty-icon">🎨</span>
                <p>Aucune couleur disponible.</p>
                <a href="/admin/colors" className="btn btn-outline btn-sm">Créer des couleurs</a>
              </div>
            ) : (
              <div className="color-grid">
                {colors.map(color => {
                  const checked = selectedColors.includes(color.id);
                  return (
                    <button
                      key={color.id}
                      type="button"
                      className={`color-card ${checked ? 'is-selected' : ''}`}
                      onClick={() => toggleColor(color.id)}
                    >
                      <span
                        className="color-preview"
                        style={{ backgroundColor: color.hex_code }}
                      />
                      <span className="color-name">{color.name}</span>
                      {checked && <span className="check-icon">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="selection-summary">
              {selectedColors.length > 0 ? (
                <p>✓ {selectedColors.length} couleur{selectedColors.length > 1 ? 's' : ''} sélectionnée{selectedColors.length > 1 ? 's' : ''}</p>
              ) : (
                <p className="warning">⚠️ Sélectionnez au moins une couleur</p>
              )}
            </div>
          </div>
        );

      case STEPS.VARIANTS:
        return (
          <div className="wizard-step">
            <div className="step-header">
              <h3>📐 Variantes (Tailles & Prix)</h3>
              <p className="step-description">Définissez les déclinaisons de votre produit.</p>
            </div>

            {/* Génération automatique */}
            <div className="variant-generator">
              <div className="generator-header">
                <h4>⚡ Génération rapide</h4>
                <p>Sélectionnez les tailles et définissez un prix de base pour générer automatiquement toutes les variantes.</p>
              </div>

              <div className="generator-controls">
                <div className="size-selector">
                  <label>Tailles</label>
                  <div className="size-chips">
                    {PRESET_SIZES.map(size => (
                      <button
                        key={size}
                        type="button"
                        className={`size-chip ${selectedSizes.includes(size) ? 'is-selected' : ''}`}
                        onClick={() => toggleSize(size)}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="price-stock-row">
                  <div className="form-group">
                    <label>Prix de base (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={basePrice}
                      onChange={e => { setBasePrice(e.target.value); setIsDirty(true); }}
                      placeholder="29.90"
                    />
                  </div>
                  <div className="form-group">
                    <label>Stock par variante</label>
                    <input
                      type="number"
                      min={0}
                      value={baseStock}
                      onChange={e => { setBaseStock(parseInt(e.target.value) || 0); setIsDirty(true); }}
                      placeholder="10"
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={generateVariants}
                    disabled={!selectedSizes.length}
                  >
                    ⚡ Générer {selectedSizes.length || 0} variantes
                  </button>
                </div>
              </div>
            </div>

            {/* Liste des variantes */}
            <div className="variants-list-section">
              <div className="section-header">
                <h4>📋 Variantes ({variants.filter(v => v.size).length})</h4>
                <button type="button" onClick={addVariantRow} className="btn btn-outline btn-sm">
                  + Ajouter manuellement
                </button>
              </div>

              {variants.length > 0 && variants.some(v => v.size) ? (
                <div className="variants-cards">
                  {variants.map((variant, index) => {
                    return (
                      <div key={variant.id ?? `new-${index}`} className="variant-card">
                        <div className="variant-card__header">
                          <span className="variant-number">#{index + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeVariantRow(index)}
                            className="btn-icon btn-remove"
                            aria-label="Supprimer"
                          >
                            ×
                          </button>
                        </div>

                        <div className="variant-card__fields">
                          <div className="field-row">
                            <div className="form-group">
                              <label>Taille</label>
                              <input
                                value={variant.size}
                                onChange={e => updateVariantField(index, 'size', e.target.value)}
                                placeholder="M"
                                required
                              />
                            </div>
                          </div>

                          <div className="field-row">
                            <div className="form-group">
                              <label>Prix (€)</label>
                              <input
                                type="number"
                                step="0.01"
                                value={variant.price}
                                onChange={e => updateVariantField(index, 'price', e.target.value)}
                                placeholder="29.90"
                                required
                              />
                            </div>
                            <div className="form-group">
                              <label>Stock</label>
                              <input
                                type="number"
                                min={0}
                                value={variant.stock}
                                onChange={e => updateVariantField(index, 'stock', e.target.value)}
                                placeholder="10"
                              />
                            </div>
                          </div>

                          {variant.sku && (
                            <div className="variant-sku">
                              <span className="sku-label">SKU:</span>
                              <code>{variant.sku}</code>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state-inline">
                  <p>Aucune variante. Utilisez la génération rapide ou ajoutez manuellement.</p>
                </div>
              )}
            </div>

            {minVariantPrice != null && (
              <div className="price-summary">
                <span>Prix minimum affiché:</span>
                <strong>{minVariantPrice.toFixed(2)} €</strong>
              </div>
            )}
          </div>
        );

      case STEPS.IMAGES: {
        const totalImages = existingImages.length + imagePreviews.length;
        return (
          <div className="wizard-step">
            <div className="step-header">
              <h3>📷 Images du produit</h3>
              <p className="step-description">Ajoutez des photos de votre produit. Cliquez sur une image pour la définir comme principale.</p>
            </div>

            {/* Existing images (when editing) */}
            {existingImages.length > 0 && (
              <div className="existing-images-section">
                <h4>Images existantes ({existingImages.length})</h4>
                <div className="image-grid">
                  {existingImages.map((img, idx) => (
                    <div
                      key={img.id}
                      className={`image-card ${primaryImageIndex === idx ? 'is-primary' : ''}`}
                      onClick={() => setAsPrimary('existing', idx)}
                    >
                      <img src={img.image_url} alt={`Image ${idx + 1}`} />
                      {primaryImageIndex === idx && <span className="image-badge">Principal</span>}
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); removeExistingImage(idx); }}
                        className="btn-remove-image"
                        aria-label="Supprimer"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload zone */}
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              className={`upload-zone ${isDragging ? 'is-dragging' : ''}`}
            >
              <div className="upload-zone__content">
                <span className="upload-icon">📁</span>
                <p>Glissez-déposez vos images ici</p>
                <span className="upload-or">ou</span>
                <label className="btn btn-outline" htmlFor="file-input-wizard">
                  Parcourir
                </label>
                <input
                  id="file-input-wizard"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={e => onFilesSelected(e.target.files)}
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            {/* New images preview */}
            {imagePreviews.length > 0 && (
              <div className="new-images-section">
                <h4>Nouvelles images ({imagePreviews.length})</h4>
                <div className="image-grid">
                  {imagePreviews.map((src, idx) => {
                    const actualIndex = existingImages.length + idx;
                    return (
                      <div
                        key={idx}
                        className={`image-card ${primaryImageIndex === actualIndex ? 'is-primary' : ''}`}
                        onClick={() => setAsPrimary('new', idx)}
                      >
                        <img src={src} alt={`Aperçu ${idx + 1}`} />
                        {primaryImageIndex === actualIndex && <span className="image-badge">Principal</span>}
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); removeNewImage(idx); }}
                          className="btn-remove-image"
                          aria-label="Supprimer"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {totalImages === 0 && (
              <p className="hint">💡 Les images sont optionnelles mais recommandées pour une meilleure conversion.</p>
            )}

            {totalImages > 0 && (
              <p className="hint">💡 Cliquez sur une image pour la définir comme image principale. Total: {totalImages} image{totalImages > 1 ? 's' : ''}</p>
            )}
          </div>
        );
      }

      case STEPS.REVIEW:
        return (
          <div className="wizard-step">
            <div className="step-header">
              <h3>✅ Résumé</h3>
              <p className="step-description">Vérifiez les informations avant de créer le produit.</p>
            </div>

            <div className="review-grid">
              <div className="review-section">
                <h4>Informations</h4>
                <dl className="review-list">
                  <div className="review-item">
                    <dt>Nom</dt>
                    <dd>{form.name || '—'}</dd>
                  </div>
                  <div className="review-item">
                    <dt>Catégorie</dt>
                    <dd>{categoryName(Number(form.category_id)) || '—'}</dd>
                  </div>
                  <div className="review-item">
                    <dt>Statut</dt>
                    <dd>
                      <span className={`status-badge status-${form.status}`}>
                        {form.status === 'active' ? 'Actif' : form.status === 'draft' ? 'Brouillon' : 'Archivé'}
                      </span>
                    </dd>
                  </div>
                  {form.description && (
                    <div className="review-item review-item--full">
                      <dt>Description</dt>
                      <dd>{form.description}</dd>
                    </div>
                  )}
                </dl>
              </div>

              <div className="review-section">
                <h4>Couleurs ({selectedColors.length})</h4>
                <div className="review-colors">
                  {selectedColors.map(id => {
                    const c = colorById(id);
                    return c ? (
                      <span key={id} className="review-color">
                        <span className="color-dot" style={{ backgroundColor: c.hex_code }} />
                        {c.name}
                      </span>
                    ) : null;
                  })}
                  {selectedColors.length === 0 && <span className="muted">Aucune couleur</span>}
                </div>
              </div>

              <div className="review-section">
                <h4>Variantes ({variants.filter(v => v.size).length})</h4>
                <div className="review-variants">
                  {variants.filter(v => v.size).slice(0, 6).map((v, i) => {
                    return (
                      <div key={i} className="review-variant">
                        <span>{v.size}</span>
                        <span>{Number(v.price).toFixed(2)}€</span>
                        <span className="stock">Stock: {v.stock}</span>
                      </div>
                    );
                  })}
                  {variants.filter(v => v.size).length > 6 && (
                    <span className="muted">+{variants.filter(v => v.size).length - 6} autres</span>
                  )}
                </div>
                {minVariantPrice != null && (
                  <p className="price-highlight">Prix affiché: <strong>{minVariantPrice.toFixed(2)}€</strong></p>
                )}
              </div>

              <div className="review-section">
                <h4>Images ({existingImages.length + imagePreviews.length})</h4>
                {(existingImages.length > 0 || imagePreviews.length > 0) ? (
                  <div className="review-images">
                    {existingImages.slice(0, 4).map((img, i) => (
                      <div key={`existing-${i}`} className={`review-image-wrapper ${primaryImageIndex === i ? 'is-primary' : ''}`}>
                        <img src={img.image_url} alt={`Image ${i + 1}`} />
                        {primaryImageIndex === i && <span className="primary-indicator">★</span>}
                      </div>
                    ))}
                    {imagePreviews.slice(0, Math.max(0, 4 - existingImages.length)).map((src, i) => {
                      const actualIndex = existingImages.length + i;
                      return (
                        <div key={`new-${i}`} className={`review-image-wrapper ${primaryImageIndex === actualIndex ? 'is-primary' : ''}`}>
                          <img src={src} alt={`Nouvelle ${i + 1}`} />
                          {primaryImageIndex === actualIndex && <span className="primary-indicator">★</span>}
                        </div>
                      );
                    })}
                    {(existingImages.length + imagePreviews.length) > 4 && (
                      <span className="muted">+{existingImages.length + imagePreviews.length - 4}</span>
                    )}
                  </div>
                ) : (
                  <span className="muted">Aucune image</span>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="product-manager">
      {/* Header avec actions */}
      <div className="manager-header">
        <div className="manager-header__left">
          <h2>Gestion des Produits</h2>
          <span className="product-count">{products.length} produit{products.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="manager-header__right">
          <div className="search-box">
            <input
              type="search"
              placeholder="Rechercher un produit..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <span className="search-icon">🔍</span>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => { resetForm(); setShowWizard(true); }}
          >
            + Nouveau produit
          </button>
        </div>
      </div>

      {/* Wizard Modal */}
      {showWizard && (
        <div className="wizard-overlay" onClick={e => e.target === e.currentTarget && resetForm()}>
          <div className="wizard-modal">
            <div className="wizard-header">
              <h2>{editingId ? 'Modifier le produit' : 'Nouveau produit'}</h2>
              <button className="btn-close" onClick={resetForm}>×</button>
            </div>

            {/* Progress bar */}
            <div className="wizard-progress">
              {STEP_LABELS.map((label, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`progress-step ${idx === currentStep ? 'is-current' : ''} ${idx < currentStep ? 'is-completed' : ''}`}
                  onClick={() => goToStep(idx)}
                  disabled={idx > currentStep && !canProceed(currentStep)}
                >
                  <span className="step-number">{idx < currentStep ? '✓' : idx + 1}</span>
                  <span className="step-label">{label}</span>
                </button>
              ))}
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="wizard-content">
              {renderStepContent()}

              {/* Navigation */}
              <div className="wizard-footer">
                <div className="wizard-footer__left">
                  {currentStep > STEPS.INFO && (
                    <button type="button" className="btn btn-outline" onClick={prevStep}>
                      ← Précédent
                    </button>
                  )}
                </div>
                <div className="wizard-footer__right">
                  {currentStep < STEPS.REVIEW ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={nextStep}
                      disabled={!canProceed(currentStep)}
                    >
                      Suivant →
                    </button>
                  ) : (
                    <button type="submit" className="btn btn-primary btn-lg">
                      {editingId ? '✓ Mettre à jour' : '✓ Créer le produit'}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Liste des produits */}
      {loading && <p className="loading-state">Chargement en cours...</p>}
      {error && <p className="error-msg">{error}</p>}

      {!loading && filteredProducts.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">📦</span>
          <h3>Aucun produit</h3>
          <p>Commencez par créer votre premier produit.</p>
          <button className="btn btn-primary" onClick={() => setShowWizard(true)}>
            + Créer un produit
          </button>
        </div>
      )}

      {filteredProducts.length > 0 && (
        <div className="products-grid">
          {filteredProducts.map(p => {
            const variantCount = p.item_variants?.length || 0;

            return (
              <div key={p.id} className="product-card">
                <div className="product-card__image">
                  {p.item_images?.[0]?.image_url ? (
                    <img src={p.item_images[0].image_url} alt={p.name} />
                  ) : (
                    <div className="no-image">📷</div>
                  )}
                  <span className={`status-indicator status-${p.status || 'active'}`} />
                </div>

                <div className="product-card__content">
                  <h3 className="product-title">{p.name}</h3>
                  <p className="product-meta">
                    {categoryName(p.category_id)} • {variantCount} variante{variantCount !== 1 ? 's' : ''}
                  </p>
                  <p className="product-price">{Number(p.price).toFixed(2)}€</p>
                </div>

                <div className="product-card__actions">
                  <button onClick={() => handleEdit(p)} className="btn btn-outline btn-sm">
                    ✏️ Modifier
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="btn btn-danger btn-sm">
                    🗑️
                  </button>
                </div>

                {p.item_images?.length > 1 && (
                  <div className="product-card__gallery">
                    {p.item_images.slice(1, 4).map(img => (
                      <div key={img.id} className="mini-thumb">
                        <img src={img.image_url} alt="" />
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); deleteExistingImage(p.id, img); }}
                          className="btn-remove-thumb"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {p.item_images.length > 4 && <span className="more-images">+{p.item_images.length - 4}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
