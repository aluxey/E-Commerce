import { pushToast } from "@/utils/toast";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { useCallback, useEffect, useMemo, useState } from "react";

const PRODUCT_DRAFT_KEY = "admin-product-draft";

// Tailles prédéfinies communes
export const PRESET_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Unique"];

// Wizard Steps (Colors step removed - all colors available for all products)
export const STEPS = {
  INFO: 0,
  VARIANTS: 1,
  IMAGES: 2,
  REVIEW: 3,
};

export const STEP_LABELS = ["Informations", "Variantes", "Images", "Résumé"];

// Helper functions
export const createEmptyVariant = () => ({
  id: null,
  size: "",
  price: "",
  stock: 0,
  sku: "",
});

export const sanitizeText = value => (value || "").trim();

const slugify = value =>
  sanitizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const randomSuffix = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 8).toUpperCase();

export const buildSku = (itemId, variant) => {
  const sizeSlug = slugify(variant.size) || "std";
  return `SKU-${itemId}-${sizeSlug}-${randomSuffix()}`.toUpperCase();
};

/**
 * Hook for managing product form state and logic
 */
export function useProductForm() {
  const [editingId, setEditingId] = useState(null);
  const [currentStep, setCurrentStep] = useState(STEPS.INFO);
  const [showWizard, setShowWizard] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    category_id: "",
    status: "active",
  });

  const [variants, setVariants] = useState([createEmptyVariant()]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [basePrice, setBasePrice] = useState("");
  const [baseStock, setBaseStock] = useState(10);
  const [newImages, setNewImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);
  const [isDirty, setIsDirty] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setForm({
      name: "",
      description: "",
      category_id: "",
      status: "active",
    });
    setVariants([createEmptyVariant()]);
    setSelectedSizes([]);
    setBasePrice("");
    setBaseStock(10);
    setEditingId(null);
    setNewImages([]);
    setImagePreviews([]);
    setExistingImages([]);
    setPrimaryImageIndex(0);
    setIsDirty(false);
    setCurrentStep(STEPS.INFO);
    setShowWizard(false);
  }, []);

  // Hook for unsaved changes warning
  useUnsavedChanges(
    isDirty,
    "Des modifications produit ne sont pas sauvegardées. Quitter la page ?"
  );

  // Load draft on mount (only when not editing)
  useEffect(() => {
    if (editingId) return;
    const raw = localStorage.getItem(PRODUCT_DRAFT_KEY);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw);
      if (draft && typeof draft === "object") {
        setForm({
          name: draft.form?.name || "",
          description: draft.form?.description || "",
          category_id: draft.form?.category_id || "",
          status: draft.form?.status || "active",
        });
        const draftVariants =
          Array.isArray(draft.variants) && draft.variants.length
            ? draft.variants.map(v => ({
                id: null,
                size: v.size || "",
                price: v.price || "",
                stock: v.stock ?? 0,
                sku: v.sku || "",
              }))
            : [createEmptyVariant()];
        setVariants(draftVariants);
        setSelectedSizes(Array.isArray(draft.selectedSizes) ? draft.selectedSizes : []);
        setBasePrice(draft.basePrice || "");
        setBaseStock(draft.baseStock ?? 10);
        setIsDirty(true);
      }
    } catch (err) {
      console.warn("Impossible de charger le brouillon produit", err);
    }
  }, [editingId]);

  // Save draft on change
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
      selectedSizes,
      basePrice,
      baseStock,
    };
    localStorage.setItem(PRODUCT_DRAFT_KEY, JSON.stringify(payload));
  }, [form, variants, selectedSizes, basePrice, baseStock, isDirty, editingId]);

  // Clear draft from localStorage
  const clearDraft = useCallback(() => {
    localStorage.removeItem(PRODUCT_DRAFT_KEY);
  }, []);

  // Form field change handler
  const handleChange = useCallback(e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setIsDirty(true);
  }, []);

  // Toggle size selection
  const toggleSize = useCallback(size => {
    setSelectedSizes(prev => {
      const exists = prev.includes(size);
      return exists ? prev.filter(s => s !== size) : [...prev, size];
    });
    setIsDirty(true);
  }, []);

  // Generate variants automatically (preserves existing variant IDs when regenerating)
  const generateVariants = useCallback(() => {
    if (!selectedSizes.length) {
      pushToast({ message: "Sélectionnez au moins une taille", variant: "warning" });
      return;
    }

    const price = parseFloat(String(basePrice).replace(",", "."));
    if (Number.isNaN(price) || price < 0) {
      pushToast({ message: "Définissez un prix de base valide", variant: "warning" });
      return;
    }

    // Build a map of existing variants by size for ID preservation
    const existingBySize = new Map();
    variants.forEach(v => {
      if (v.id && v.size) {
        existingBySize.set(v.size, v);
      }
    });

    const newVariants = selectedSizes.map(size => {
      const existing = existingBySize.get(size);
      return {
        id: existing?.id || null, // Preserve ID if variant with same size exists
        size,
        price: price.toFixed(2),
        stock: baseStock,
        sku: existing?.sku || "", // Preserve SKU if exists
      };
    });

    setVariants(newVariants);
    setIsDirty(true);
    pushToast({ message: `${newVariants.length} variantes générées`, variant: "success" });
  }, [selectedSizes, basePrice, baseStock, variants]);

  // Add empty variant row
  const addVariantRow = useCallback(() => {
    setVariants(prev => [...prev, createEmptyVariant()]);
    setIsDirty(true);
  }, []);

  // Update variant field
  const updateVariantField = useCallback((index, field, value) => {
    setVariants(prev =>
      prev.map((variant, idx) => (idx === index ? { ...variant, [field]: value } : variant))
    );
    setIsDirty(true);
  }, []);

  // Remove variant row
  const removeVariantRow = useCallback(index => {
    setVariants(prev => {
      if (prev.length === 1) return [createEmptyVariant()];
      return prev.filter((_, idx) => idx !== index);
    });
    setIsDirty(true);
  }, []);

  // Calculate minimum variant price
  const minVariantPrice = useMemo(() => {
    const prices = variants
      .map(v => parseFloat(String(v.price).replace(",", ".")))
      .filter(v => !Number.isNaN(v) && v >= 0);
    if (!prices.length) return null;
    return Math.min(...prices);
  }, [variants]);

  // Validate variants
  const validateVariants = useCallback(() => {
    const errors = [];
    const combos = new Set();
    const cleaned = variants.map((variant, index) => {
      const size = sanitizeText(variant.size);
      const price = parseFloat(String(variant.price).replace(",", "."));
      const stock = Math.max(0, parseInt(variant.stock, 10) || 0);

      if (!size) errors.push(`Variante #${index + 1}: la taille est requise.`);
      if (Number.isNaN(price)) errors.push(`Variante #${index + 1}: prix invalide.`);
      if (!Number.isNaN(price) && price < 0)
        errors.push(`Variante #${index + 1}: le prix doit être positif.`);

      const key = size || "—";
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
    if (!valid.length) errors.push("Au moins une variante valide est requise.");

    return { errors, validVariants: valid };
  }, [variants]);

  // Image handling
  const onFilesSelected = useCallback(files => {
    const list = Array.from(files || []);
    if (!list.length) return;
    setNewImages(prev => [...prev, ...list]);
    const previews = list.map(f => URL.createObjectURL(f));
    setImagePreviews(prev => [...prev, ...previews]);
    setIsDirty(true);
  }, []);

  const onDrop = useCallback(
    e => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      onFilesSelected(e.dataTransfer.files);
    },
    [onFilesSelected]
  );

  const onDragOver = useCallback(e => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(e => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const removeNewImage = useCallback(
    idx => {
      const existingCount = existingImages.length;
      if (primaryImageIndex === existingCount + idx) {
        setPrimaryImageIndex(0);
      } else if (primaryImageIndex > existingCount + idx) {
        setPrimaryImageIndex(prev => prev - 1);
      }
      setNewImages(prev => prev.filter((_, i) => i !== idx));
      setImagePreviews(prev => prev.filter((_, i) => i !== idx));
      setIsDirty(true);
    },
    [existingImages.length, primaryImageIndex]
  );

  const setAsPrimary = useCallback(
    (type, idx) => {
      const existingCount = existingImages.length;
      const newIndex = type === "existing" ? idx : existingCount + idx;
      setPrimaryImageIndex(newIndex);
      setIsDirty(true);
    },
    [existingImages.length]
  );

  // Reorder images (for drag-and-drop)
  // Takes unified indices and reorders both existing and new images
  const reorderImages = useCallback(
    (fromIndex, toIndex) => {
      const existingCount = existingImages.length;
      const totalCount = existingCount + newImages.length;

      if (fromIndex < 0 || fromIndex >= totalCount || toIndex < 0 || toIndex >= totalCount) {
        return;
      }

      // Build unified array of image references
      const unified = [
        ...existingImages.map((img, i) => ({ type: "existing", index: i, data: img })),
        ...newImages.map((file, i) => ({ type: "new", index: i, data: file, preview: imagePreviews[i] })),
      ];

      // Perform the reorder
      const [moved] = unified.splice(fromIndex, 1);
      unified.splice(toIndex, 0, moved);

      // Separate back into existing and new
      const reorderedExisting = [];
      const reorderedNew = [];
      const reorderedPreviews = [];

      unified.forEach(item => {
        if (item.type === "existing") {
          reorderedExisting.push(item.data);
        } else {
          reorderedNew.push(item.data);
          reorderedPreviews.push(item.preview);
        }
      });

      setExistingImages(reorderedExisting);
      setNewImages(reorderedNew);
      setImagePreviews(reorderedPreviews);

      // Update primary index if needed
      if (primaryImageIndex === fromIndex) {
        setPrimaryImageIndex(toIndex);
      } else if (fromIndex < primaryImageIndex && toIndex >= primaryImageIndex) {
        setPrimaryImageIndex(prev => prev - 1);
      } else if (fromIndex > primaryImageIndex && toIndex <= primaryImageIndex) {
        setPrimaryImageIndex(prev => prev + 1);
      }

      setIsDirty(true);
    },
    [existingImages, newImages, imagePreviews, primaryImageIndex]
  );

  // Wizard navigation
  const canProceed = useCallback(
    step => {
      switch (step) {
        case STEPS.INFO:
          return sanitizeText(form.name).length > 0;
        case STEPS.VARIANTS:
          return variants.some(v => v.size && v.price);
        case STEPS.IMAGES:
          return true;
        default:
          return true;
      }
    },
    [form.name, variants]
  );

  const nextStep = useCallback(() => {
    if (currentStep < STEPS.REVIEW && canProceed(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, canProceed]);

  const prevStep = useCallback(() => {
    if (currentStep > STEPS.INFO) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback(
    step => {
      if (step <= currentStep || canProceed(currentStep)) {
        setCurrentStep(step);
      }
    },
    [currentStep, canProceed]
  );

  // Open wizard for new product
  const openNewProduct = useCallback(() => {
    resetForm();
    setShowWizard(true);
  }, [resetForm]);

  // Load product for editing
  const loadProductForEdit = useCallback(
    (product, productVariants = []) => {
      setEditingId(product.id);
      setForm({
        name: product.name || "",
        description: product.description || "",
        category_id: product.category_id || "",
        status: product.status || "active",
      });

      // Sort images by position if available
      const productImages = product.item_images || [];
      const sortedImages = [...productImages].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      setExistingImages(sortedImages);
      setPrimaryImageIndex(0);
      setNewImages([]);
      setImagePreviews([]);
      setIsDirty(false);
      clearDraft();

      const mapped = productVariants.map(v => ({
        id: v.id,
        size: v.size || "",
        price: v.price != null ? Number(v.price).toFixed(2) : "",
        stock: v.stock ?? 0,
        sku: v.sku || "",
      }));
      setVariants(mapped.length ? mapped : [createEmptyVariant()]);

      const sizes = [...new Set(mapped.map(v => v.size).filter(Boolean))];
      setSelectedSizes(sizes);

      setCurrentStep(STEPS.INFO);
      setShowWizard(true);
      setIsDirty(false);
    },
    [clearDraft]
  );

  return {
    // State
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

    // Setters
    setEditingId,
    setExistingImages,
    setPrimaryImageIndex,
    setBasePrice,
    setBaseStock,
    setVariants,

    // Actions
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
    reorderImages,
    canProceed,
    nextStep,
    prevStep,
    goToStep,
    openNewProduct,
    loadProductForEdit,
  };
}

export default useProductForm;
