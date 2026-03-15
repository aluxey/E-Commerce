import { useTranslation } from "react-i18next";
import { useProductForm } from "@/hooks/useProductForm";
import ProductGrid from "./ProductManager/ProductGrid";
import ProductManagerHeader from "./ProductManager/ProductManagerHeader";
import ProductWizardModal from "./ProductManager/ProductWizardModal";
import useProductManagerData from "./ProductManager/useProductManagerData";

export default function ProductManager() {
  const { t } = useTranslation();
  const formHook = useProductForm();
  const manager = useProductManagerData({ t, formHook });

  return (
    <div className="product-manager">
      <ProductManagerHeader
        productCount={manager.products.length}
        searchQuery={manager.searchQuery}
        setSearchQuery={manager.setSearchQuery}
        onCreate={formHook.openNewProduct}
      />

      <ProductWizardModal
        {...formHook}
        groupedCategories={manager.groupedCategories}
        orphanCategories={manager.orphanCategories}
        categoryName={manager.categoryName}
        minVariantPrice={manager.minVariantPrice}
        removeExistingImage={manager.removeExistingImage}
        handleSubmit={manager.handleSubmit}
        isSubmitting={manager.isSubmitting}
      />

      <ProductGrid
        loading={manager.loading}
        error={manager.error}
        filteredProducts={manager.filteredProducts}
        categoryName={manager.categoryName}
        onCreate={formHook.openNewProduct}
        onEdit={manager.handleEdit}
        onDelete={manager.handleDelete}
        onDeleteImage={manager.deleteExistingImage}
      />
    </div>
  );
}
