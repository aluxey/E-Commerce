import { STEPS, STEP_LABELS, buildSku, sanitizeText, useProductForm } from "@/hooks/useProductForm";
import { supabase } from "@/supabase/supabaseClient";
import { useEffect, useMemo, useState } from "react";
import { Search, X, Check, ChevronLeft, ChevronRight, Package, Camera, Trash2 } from "lucide-react";
import {
  deleteItem,
  deleteItemImage,
  deleteVariants,
  fetchVariantsByItem,
  insertVariants,
  listCategories,
  listProducts,
  removeProductImage,
  reorderItemImages,
  updateItemPriceMeta,
  upsertItem,
  upsertVariants,
} from "../../services/adminProducts";
import { pushToast } from "../ToastHost";
import { ImagesStep, InfoStep, ReviewStep, VariantsStep } from "./ProductForm";

export const TABLE_ITEMS = "items";
const TABLE_VARIANTS = "item_variants";

export default function ProductManager() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Use custom hook for form management
  const formHook = useProductForm();

  const {
    editingId,
    currentStep,
    showWizard,
    form,
    variants,
    selectedSizes,
    basePrice,
    baseStock,
    newImages,
    imagePreviews,
    existingImages,
    primaryImageIndex,
    isDirty,
    isDragging,
    minVariantPrice,
    setExistingImages,
    setPrimaryImageIndex,
    setBasePrice,
    setBaseStock,
    resetForm,
    clearDraft,
    handleChange,
    toggleSize,
    generateVariants,
    addVariantRow,
    updateVariantField,
    removeVariantRow,
    validateVariants,
    onFilesSelected,
    onDrop,
    onDragOver,
    onDragLeave,
    removeNewImage,
    setAsPrimary,
    canProceed,
    nextStep,
    prevStep,
    goToStep,
    openNewProduct,
    loadProductForEdit,
  } = formHook;

  // Data fetching
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await listProducts();
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error("Erreur lors du chargement des produits :", err.message);
      setError("Erreur lors du chargement des produits.");
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

  // Upload image helper
  const uploadImage = async (file, itemId) => {
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `${itemId}/${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filePath, file);
    if (uploadError) {
      console.error("Erreur upload image:", uploadError.message);
      return null;
    }
    const { data: publicData } = supabase.storage.from("product-images").getPublicUrl(filePath);
    const imageUrl = publicData?.publicUrl;
    if (!imageUrl) return null;
    const { error: dbError } = await supabase
      .from("item_images")
      .insert([{ item_id: itemId, image_url: imageUrl }]);
    if (dbError) {
      console.error("Erreur enregistrement image:", dbError.message);
      return null;
    }
    return imageUrl;
  };

  // Form submission
  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const trimmedName = sanitizeText(form.name);
      if (!trimmedName) {
        pushToast({ message: "Le nom du produit est requis.", variant: "error" });
        return;
      }

      const { errors: variantErrors, validVariants } = validateVariants();
      if (variantErrors.length) {
        pushToast({ message: variantErrors[0], variant: "error" });
        return;
      }

      const minPrice = Math.min(...validVariants.map(v => v.price));

      const itemPayload = {
        name: trimmedName,
        description: sanitizeText(form.description) || null,
        category_id: form.category_id ? Number(form.category_id) : null,
        price: minPrice,
        status: form.status,
        pattern_type: form.pattern_type || null,
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

      // Fetch existing variants
      const { data: existingVariants, error: existingError } = await supabase
        .from(TABLE_VARIANTS)
        .select("id")
        .eq("item_id", itemId);
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
      const variantsToInsert = variantsPayload.filter(v => !v.id).map(({ ...rest }) => rest);

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

      if (existingCount > 1 && !primaryIsNew && primaryImageIndex > 0) {
        const reorderedIds = [
          existingImages[primaryImageIndex].id,
          ...existingImages.filter((_, i) => i !== primaryImageIndex).map(img => img.id),
        ];
        const { error: reorderError } = await reorderItemImages(itemId, reorderedIds);
        if (reorderError) {
          console.warn("Could not reorder images:", reorderError);
        }
      }

      // Upload new images
      if (newImages.length > 0) {
        if (primaryIsNew && existingCount === 0) {
          const primaryNewIdx = primaryImageIndex - existingCount;
          const reorderedImages = [
            newImages[primaryNewIdx],
            ...newImages.filter((_, i) => i !== primaryNewIdx),
          ];
          for (const file of reorderedImages) {
            await uploadImage(file, itemId);
          }
        } else {
          for (const file of newImages) {
            await uploadImage(file, itemId);
          }
        }
      }

      resetForm();
      fetchProducts();
      pushToast({ message: editingId ? "Produit mis à jour" : "Produit créé", variant: "success" });
      clearDraft();
    } catch (err) {
      console.error("Erreur sauvegarde produit:", err.message);
      pushToast({ message: "Erreur lors de l'enregistrement du produit.", variant: "error" });
    }
  };

  // Delete product
  const handleDelete = async id => {
    if (!confirm("Supprimer ce produit ?")) return;
    try {
      const { error } = await deleteItem(id);
      if (error) throw error;
      fetchProducts();
      pushToast({ message: "Produit supprimé", variant: "success" });
    } catch (err) {
      console.error("Erreur lors de la suppression :", err.message);
      pushToast({ message: "Erreur lors de la suppression.", variant: "error" });
    }
  };

  // Edit product
  const handleEdit = async product => {
    const { data, error } = await fetchVariantsByItem(product.id);
    loadProductForEdit(product, error ? [] : data || []);
  };

  // Remove existing image
  const removeExistingImage = async idx => {
    const image = existingImages[idx];
    if (!image) return;

    try {
      const marker = "/product-images/";
      const urlIdx = image.image_url.indexOf(marker);
      if (urlIdx !== -1) {
        const path = image.image_url.substring(urlIdx + marker.length);
        await removeProductImage(path);
      }
      await deleteItemImage(image.id);

      setExistingImages(prev => prev.filter((_, i) => i !== idx));

      if (primaryImageIndex === idx) {
        setPrimaryImageIndex(0);
      } else if (primaryImageIndex > idx) {
        setPrimaryImageIndex(prev => prev - 1);
      }

      if (editingId) {
        setProducts(prev =>
          prev.map(p =>
            p.id === editingId
              ? { ...p, item_images: (p.item_images || []).filter(img => img.id !== image.id) }
              : p
          )
        );
      }

      pushToast({ message: "Image supprimée", variant: "success" });
    } catch (err) {
      console.error("Erreur suppression image:", err.message);
      pushToast({ message: "Impossible de supprimer l'image.", variant: "error" });
    }
  };

  // Delete existing image from product card
  const deleteExistingImage = async (productId, image) => {
    try {
      const marker = "/product-images/";
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
      pushToast({ message: "Image supprimée", variant: "info" });
    } catch (err) {
      console.error("Erreur suppression image:", err.message);
      pushToast({ message: "Impossible de supprimer l'image.", variant: "error" });
    }
  };

  // Category helpers
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
      if (!cat) return "—";
      const parent = cat.parent_id ? byId.get(cat.parent_id) || cat.parent : null;
      return parent ? `${parent.name} › ${cat.name}` : cat.name;
    };
  }, [categoryTree]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(p => p.name?.toLowerCase().includes(q) || p.id?.toString().includes(q));
  }, [products, searchQuery]);

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case STEPS.INFO:
        return (
          <InfoStep
            form={form}
            handleChange={handleChange}
            groupedCategories={groupedCategories}
            orphanCategories={orphanCategories}
            categoryName={categoryName}
          />
        );

      case STEPS.VARIANTS:
        return (
          <VariantsStep
            variants={variants}
            selectedSizes={selectedSizes}
            basePrice={basePrice}
            baseStock={baseStock}
            minVariantPrice={minVariantPrice}
            toggleSize={toggleSize}
            setBasePrice={setBasePrice}
            setBaseStock={setBaseStock}
            generateVariants={generateVariants}
            addVariantRow={addVariantRow}
            updateVariantField={updateVariantField}
            removeVariantRow={removeVariantRow}
            setIsDirty={() => {}}
          />
        );

      case STEPS.IMAGES:
        return (
          <ImagesStep
            existingImages={existingImages}
            imagePreviews={imagePreviews}
            primaryImageIndex={primaryImageIndex}
            isDragging={isDragging}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onFilesSelected={onFilesSelected}
            removeExistingImage={removeExistingImage}
            removeNewImage={removeNewImage}
            setAsPrimary={setAsPrimary}
          />
        );

      case STEPS.REVIEW:
        return (
          <ReviewStep
            form={form}
            variants={variants}
            existingImages={existingImages}
            imagePreviews={imagePreviews}
            primaryImageIndex={primaryImageIndex}
            minVariantPrice={minVariantPrice}
            categoryName={categoryName}
          />
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
          <span className="product-count">
            {products.length} produit{products.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="manager-header__right">
          <div className="search-box">
            <input
              type="search"
              placeholder="Rechercher un produit..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <span className="search-icon"><Search size={18} /></span>
          </div>
          <button className="btn btn-primary" onClick={openNewProduct}>
            + Nouveau produit
          </button>
        </div>
      </div>

      {/* Wizard Modal */}
      {showWizard && (
        <div className="wizard-overlay" onClick={e => e.target === e.currentTarget && resetForm()}>
          <div className="wizard-modal">
            <div className="wizard-header">
              <h2>{editingId ? "Modifier le produit" : "Nouveau produit"}</h2>
              <button className="btn-close" onClick={resetForm}>
                <X size={20} />
              </button>
            </div>

            {/* Progress bar */}
            <div className="wizard-progress">
              {STEP_LABELS.map((label, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`progress-step ${idx === currentStep ? "is-current" : ""} ${
                    idx < currentStep ? "is-completed" : ""
                  }`}
                  onClick={() => goToStep(idx)}
                  disabled={idx > currentStep && !canProceed(currentStep)}
                >
                  <span className="step-number">{idx < currentStep ? <Check size={14} /> : idx + 1}</span>
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
                      <ChevronLeft size={16} /> Précédent
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
                      Suivant <ChevronRight size={16} />
                    </button>
                  ) : (
                    <button type="submit" className="btn btn-primary btn-lg">
                      <Check size={16} /> {editingId ? "Mettre à jour" : "Créer le produit"}
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
          <span className="empty-icon"><Package size={48} /></span>
          <h3>Aucun produit</h3>
          <p>Commencez par créer votre premier produit.</p>
          <button className="btn btn-primary" onClick={openNewProduct}>
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
                    <div className="no-image"><Camera size={24} /></div>
                  )}
                  <span className={`status-indicator status-${p.status || "active"}`} />
                </div>

                <div className="product-card__content">
                  <h3 className="product-title">{p.name}</h3>
                  <p className="product-meta">
                    {categoryName(p.category_id)} • {variantCount} variante
                    {variantCount !== 1 ? "s" : ""}
                  </p>
                  <p className="product-price">{Number(p.price).toFixed(2)}€</p>
                </div>

                <div className="product-card__actions">
                  <button onClick={() => handleEdit(p)} className="btn btn-outline btn-sm">
                    Modifier
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="btn btn-danger btn-sm">
                    <Trash2 size={16} />
                  </button>
                </div>

                {p.item_images?.length > 1 && (
                  <div className="product-card__gallery">
                    {p.item_images.slice(1, 4).map(img => (
                      <div key={img.id} className="mini-thumb">
                        <img src={img.image_url} alt="" />
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            deleteExistingImage(p.id, img);
                          }}
                          className="btn-remove-thumb"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {p.item_images.length > 4 && (
                      <span className="more-images">+{p.item_images.length - 4}</span>
                    )}
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
