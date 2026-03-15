import { Camera, Package, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import AppImage from "@/components/ui/AppImage";

export default function ProductGrid({
  loading,
  error,
  filteredProducts,
  categoryName,
  onCreate,
  onEdit,
  onDelete,
  onDeleteImage,
}) {
  const { t } = useTranslation();

  if (loading) {
    return <p className="loading-state">{t("admin.common.loading")}</p>;
  }

  if (error) {
    return <p className="error-msg">{error}</p>;
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon"><Package size={48} /></span>
        <h3>{t("admin.products.empty.title")}</h3>
        <p>{t("admin.products.empty.description")}</p>
        <button className="btn btn-primary" onClick={onCreate}>
          {t("admin.products.empty.cta")}
        </button>
      </div>
    );
  }

  return (
    <div className="products-grid">
      {filteredProducts.map(product => {
        const variantCount = product.item_variants?.length || 0;

        return (
          <div key={product.id} className="product-card">
            <div className="product-card__image">
              {product.item_images?.[0]?.image_url ? (
                <AppImage
                  src={product.item_images[0].image_url}
                  alt={product.name}
                  sizes="(max-width: 768px) 50vw, 220px"
                />
              ) : (
                <div className="no-image"><Camera size={24} /></div>
              )}
              <span className={`status-indicator status-${product.status || "active"}`} />
            </div>

            <div className="product-card__content">
              <h3 className="product-title">{product.name}</h3>
              <p className="product-meta">
                {categoryName(product.category_id)} • {t("admin.products.manager.variantCount", { count: variantCount })}
              </p>
              <p className="product-price">{Number(product.price).toFixed(2)}€</p>
            </div>

            <div className="product-card__actions">
              <button onClick={() => onEdit(product)} className="btn btn-outline btn-sm">
                {t("admin.common.edit")}
              </button>
              <button onClick={() => onDelete(product.id)} className="btn btn-danger btn-sm">
                <Trash2 size={16} />
              </button>
            </div>

            {product.item_images?.length > 1 && (
              <div className="product-card__gallery">
                {product.item_images.slice(1, 4).map(image => (
                  <div key={image.id} className="mini-thumb">
                    <AppImage src={image.image_url} alt="" sizes="64px" />
                    <button
                      type="button"
                      onClick={event => {
                        event.stopPropagation();
                        onDeleteImage(product.id, image);
                      }}
                      className="btn-remove-thumb"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {product.item_images.length > 4 && (
                  <span className="more-images">+{product.item_images.length - 4}</span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
