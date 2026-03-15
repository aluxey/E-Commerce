import { useCallback, useEffect, useMemo, useState } from "react";
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
  listVariantIdsByItem,
  removeProductImage,
  reorderItemImages,
  updateItemPriceMeta,
  uploadProductImage,
  upsertItem,
  upsertVariants,
} from "@/services/adminProducts";
import { buildSku, sanitizeText, STEPS } from "@/hooks/useProductForm";
import { pushToast } from "@/utils/toast";
import { extractProductImagePath } from "./helpers";

export default function useProductManagerData({ t, formHook }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    editingId,
    currentStep,
    form,
    existingImages,
    primaryImageIndex,
    newImages,
    resetForm,
    clearDraft,
    validateVariants,
    loadProductForEdit,
    setExistingImages,
    setPrimaryImageIndex,
    minVariantPrice,
  } = formHook;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await listProducts();
      if (fetchError) throw fetchError;
      setProducts(data || []);
    } catch (fetchError) {
      console.error("Erreur lors du chargement des produits :", fetchError.message);
      setError(t("admin.products.error.load"));
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  const fetchCategoriesList = useCallback(async () => {
    const { data, error: fetchError } = await listCategories();
    if (!fetchError) setCategories(data || []);
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategoriesList();
  }, [fetchProducts, fetchCategoriesList]);

  const categoryTree = useMemo(() => {
    const parents = [];
    const children = new Map();
    const byId = new Map();

    categories.forEach(category => {
      byId.set(category.id, category);
      if (!category.parent_id) {
        parents.push(category);
        return;
      }
      const siblings = children.get(category.parent_id) || [];
      siblings.push(category);
      children.set(category.parent_id, siblings);
    });

    parents.sort((a, b) => a.name.localeCompare(b.name));
    children.forEach(group => group.sort((a, b) => a.name.localeCompare(b.name)));

    return { parents, children, byId };
  }, [categories]);

  const { groupedCategories, orphanCategories } = useMemo(() => {
    const seen = new Set();
    const groups = categoryTree.parents.map(parent => {
      const children = categoryTree.children.get(parent.id) || [];
      seen.add(parent.id);
      children.forEach(child => seen.add(child.id));
      return { parent, children };
    });

    return {
      groupedCategories: groups,
      orphanCategories: categories.filter(category => !seen.has(category.id)),
    };
  }, [categories, categoryTree]);

  const categoryName = useMemo(() => {
    const byId = categoryTree.byId;
    return id => {
      const category = byId.get(id);
      if (!category) return "—";
      const parent = category.parent_id ? byId.get(category.parent_id) || category.parent : null;
      return parent ? `${parent.name} › ${category.name}` : category.name;
    };
  }, [categoryTree]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const normalizedQuery = searchQuery.toLowerCase();
    return products.filter(product =>
      product.name?.toLowerCase().includes(normalizedQuery) || product.id?.toString().includes(normalizedQuery)
    );
  }, [products, searchQuery]);

  const uploadImage = useCallback(async (file, itemId, position = 0) => {
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `${itemId}/${fileName}`;
    const { error: uploadError } = await uploadProductImage(filePath, file);
    if (uploadError) {
      console.error("Erreur upload image:", uploadError.message);
      return null;
    }

    const { data: publicData } = getPublicImageUrl(filePath);
    const imageUrl = publicData?.publicUrl;
    if (!imageUrl) return null;

    const { error: insertError } = await insertItemImage(itemId, imageUrl, position);
    if (insertError) {
      console.error("Erreur enregistrement image:", insertError.message);
      return null;
    }

    return imageUrl;
  }, []);

  const handleSubmit = useCallback(async event => {
    event.preventDefault();
    if (currentStep !== STEPS.REVIEW || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const trimmedName = sanitizeText(form.name);
      if (!trimmedName) {
        pushToast({ message: t("admin.products.messages.nameRequired"), variant: "error" });
        return;
      }

      const { errors: variantErrors, validVariants } = validateVariants();
      if (variantErrors.length) {
        pushToast({ message: variantErrors[0], variant: "error" });
        return;
      }

      const minPrice = Math.min(...validVariants.map(variant => variant.price));
      const itemPayload = {
        name: trimmedName,
        description: sanitizeText(form.description) || null,
        category_id: form.category_id ? Number(form.category_id) : null,
        price: minPrice,
        status: form.status,
      };

      let itemId = editingId;
      if (editingId) {
        const { error: updateError } = await upsertItem(itemPayload, editingId);
        if (updateError) throw updateError;
      } else {
        const { data, error: insertError } = await upsertItem(itemPayload, null);
        if (insertError) throw insertError;
        itemId = data.id;
      }

      const { ids: existingVariantIds, error: variantIdsError } = await listVariantIdsByItem(itemId);
      if (variantIdsError) throw variantIdsError;

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

      const variantsToUpdate = variantsPayload.filter(variant => variant.id);
      const variantsToInsert = variantsPayload.filter(variant => !variant.id);

      if (variantsToUpdate.length) {
        const { error: updateVariantsError } = await upsertVariants(variantsToUpdate);
        if (updateVariantsError) throw updateVariantsError;
      }

      if (variantsToInsert.length) {
        const { error: insertVariantsError } = await insertVariants(variantsToInsert);
        if (insertVariantsError) throw insertVariantsError;
      }

      const keptVariantIds = variantsToUpdate.map(variant => variant.id);
      const variantsToDelete = existingVariantIds.filter(id => !keptVariantIds.includes(id));
      if (variantsToDelete.length) {
        const { error: deleteVariantsError } = await deleteVariants(variantsToDelete);
        if (deleteVariantsError) throw deleteVariantsError;
      }

      const { error: priceError } = await updateItemPriceMeta(itemId, minPrice);
      if (priceError) throw priceError;

      if (existingImages.length > 0) {
        const existingImageIds = existingImages.map(image => image.id);
        const { error: reorderError } = await reorderItemImages(itemId, existingImageIds);
        if (reorderError) {
          console.warn("Could not reorder images:", reorderError);
        }
      }

      if (newImages.length > 0) {
        const startPosition = existingImages.length;
        for (let index = 0; index < newImages.length; index += 1) {
          await uploadImage(newImages[index], itemId, startPosition + index);
        }
      }

      resetForm();
      fetchProducts();
      clearDraft();
      pushToast({
        message: editingId ? t("admin.products.messages.updated") : t("admin.products.messages.created"),
        variant: "success",
      });
    } catch (submitError) {
      console.error("Erreur sauvegarde produit:", submitError.message);
      pushToast({ message: t("admin.products.messages.error"), variant: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    clearDraft,
    currentStep,
    editingId,
    existingImages,
    fetchProducts,
    form.category_id,
    form.description,
    form.name,
    form.status,
    isSubmitting,
    newImages,
    resetForm,
    t,
    uploadImage,
    validateVariants,
  ]);

  const handleDelete = useCallback(async id => {
    if (!window.confirm(t("admin.products.deleteConfirm"))) return;
    try {
      const { error: deleteError } = await deleteItem(id);
      if (deleteError) throw deleteError;
      fetchProducts();
      pushToast({ message: t("admin.products.messages.deleted"), variant: "success" });
    } catch (deleteError) {
      console.error("Erreur lors de la suppression :", deleteError.message);
      pushToast({ message: t("admin.products.error.delete"), variant: "error" });
    }
  }, [fetchProducts, t]);

  const handleEdit = useCallback(async product => {
    const { data, error: fetchError } = await fetchVariantsByItem(product.id);
    loadProductForEdit(product, fetchError ? [] : data || []);
  }, [loadProductForEdit]);

  const removeExistingImage = useCallback(async index => {
    const image = existingImages[index];
    if (!image) return;

    try {
      const imagePath = extractProductImagePath(image.image_url);
      if (imagePath) {
        await removeProductImage(imagePath);
      }
      await deleteItemImage(image.id);

      setExistingImages(previous => previous.filter((_, imageIndex) => imageIndex !== index));

      if (primaryImageIndex === index) {
        setPrimaryImageIndex(0);
      } else if (primaryImageIndex > index) {
        setPrimaryImageIndex(previous => previous - 1);
      }

      if (editingId) {
        setProducts(previous =>
          previous.map(product =>
            product.id === editingId
              ? { ...product, item_images: (product.item_images || []).filter(entry => entry.id !== image.id) }
              : product
          )
        );
      }

      pushToast({ message: t("admin.products.success.imageDeleted"), variant: "success" });
    } catch (removeError) {
      console.error("Erreur suppression image:", removeError.message);
      pushToast({ message: t("admin.products.error.imageDelete"), variant: "error" });
    }
  }, [editingId, existingImages, primaryImageIndex, setExistingImages, setPrimaryImageIndex, t]);

  const deleteExistingImage = useCallback(async (productId, image) => {
    try {
      const imagePath = extractProductImagePath(image.image_url);
      if (imagePath) {
        await removeProductImage(imagePath);
      }
      await deleteItemImage(image.id);

      setProducts(previous =>
        previous.map(product =>
          product.id === productId
            ? { ...product, item_images: (product.item_images || []).filter(entry => entry.id !== image.id) }
            : product
        )
      );

      pushToast({ message: t("admin.products.success.imageDeleted"), variant: "info" });
    } catch (removeError) {
      console.error("Erreur suppression image:", removeError.message);
      pushToast({ message: t("admin.products.error.imageDelete"), variant: "error" });
    }
  }, [t]);

  return {
    categories,
    categoryName,
    deleteExistingImage,
    error,
    filteredProducts,
    groupedCategories,
    handleDelete,
    handleEdit,
    handleSubmit,
    isSubmitting,
    loading,
    minVariantPrice,
    orphanCategories,
    products,
    removeExistingImage,
    searchQuery,
    setSearchQuery,
  };
}
