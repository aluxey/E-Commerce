import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { ErrorMessage, LoadingMessage } from "../components/StatusMessage";
import { useAuth } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import { listColors } from "../services/adminColors";
import { fetchItemDetail, fetchRelatedItems } from "../services/items";
import { loadAllRatings, submitRating } from "../services/ratings";
import "../styles/itemPage.css";

export default function ItemDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [activeImage, setActiveImage] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [variants, setVariants] = useState([]);
  const [colors, setColors] = useState([]);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [avgRating, setAvgRating] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [activeTab, setActiveTab] = useState("details");
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [relatedItems, setRelatedItems] = useState([]);
  const [selectedHookType, setSelectedHookType] = useState("default");
  // const [deliveryDate, setDeliveryDate] = useState(''); // Temporarily disabled
  const [error, setError] = useState(false);

  const navigate = useNavigate();
  const { addItem } = useContext(CartContext);
  const { session } = useAuth();
  const { t, i18n } = useTranslation();
  const locale = useMemo(() => (i18n.language === "fr" ? "fr-FR" : "de-DE"), [i18n.language]);

  const colorOptions = useMemo(() => {
    // All colors are now available for all products
    return colors.map(color => ({
      value: color.id,
      label: color.name,
      hex: color.hex_code,
      hasStock: true,
      compatible: true,
    }));
  }, [colors]);

  const sizeOptions = useMemo(() => {
    if (!variants.length) return [];
    const map = new Map();
    for (const v of variants) {
      const key = v.size || "";
      const label = v.size || t("productDetail.oneSize");
      const entry = map.get(key) || { value: key, label, hasStock: false, compatible: true };
      const inStock = v.stock == null || v.stock > 0;
      if (inStock) entry.hasStock = true;
      map.set(key, entry);
    }
    const result = Array.from(map.values());
    return result;
  }, [t, variants]);

  const { hasSizeDimension } = useMemo(() => {
    const sizeSet = new Set(variants.map(v => (v.size || "").trim()));
    sizeSet.delete("");
    return {
      hasSizeDimension: sizeSet.size > 0,
    };
  }, [variants]);

  const selectedVariant = useMemo(() => {
    if (!variants.length) return null;
    if (hasSizeDimension) {
      return variants.find(v => (v.size || "") === selectedSize) || null;
    }
    // No size dimension: pick first variant
    return variants[0] || null;
  }, [variants, selectedSize, hasSizeDimension]);

  const showColorSelect =
    colorOptions.length > 1 || (colorOptions.length === 1 && colorOptions[0].value !== "");
  const priceToDisplay =
    selectedVariant?.price != null
      ? Number(selectedVariant.price)
      : item?.price != null
      ? Number(item.price)
      : 0;
  const isOutOfStock = selectedVariant
    ? selectedVariant.stock != null
      ? selectedVariant.stock <= 0
      : false
    : !variants.length;

  const formatCategoryPath = cat => {
    if (!cat) return "";
    const parentName = cat.parent?.name;
    return parentName ? `${parentName} › ${cat.name}` : cat.name;
  };

  const categoryPath = useMemo(() => formatCategoryPath(item?.categories), [item]);

  useEffect(() => {
    if (!colorOptions.length) {
      setSelectedColor("");
      return;
    }
    if (!colorOptions.some(option => option.value === selectedColor)) {
      const preferred = colorOptions.find(option => option.hasStock) || colorOptions[0];
      setSelectedColor(preferred.value);
    }
  }, [colorOptions, selectedColor]);

  useEffect(() => {
    if (!selectedVariant) return;
    const stock = selectedVariant.stock ?? null;
    if (stock != null && stock > 0 && quantity > stock) {
      setQuantity(stock);
    }
  }, [selectedVariant, quantity]);

  const selectedVariantId = selectedVariant?.id ?? null;
  useEffect(() => {
    setQuantity(1);
  }, [selectedVariantId]);

  // Calculer la date de livraison estimée - Temporarily disabled
  // useEffect(() => {
  //   const deliveryDateCalc = new Date();
  //   deliveryDateCalc.setDate(deliveryDateCalc.getDate() + 3); // +3 jours
  //   setDeliveryDate(
  //     deliveryDateCalc.toLocaleDateString(locale, {
  //       weekday: 'long',
  //       day: 'numeric',
  //       month: 'long',
  //     })
  //   );
  // }, [locale]);

  const loadItem = useCallback(async () => {
    setIsLoading(true);
    setError(false);

    const [itemResult, colorsResult] = await Promise.all([
      fetchItemDetail(id),
      listColors()
    ]);

    const { data, error: itemError } = itemResult;
    if (itemError || !data) {
      console.error("Erreur lors du chargement de l'item :", itemError);
      setError(true);
      setIsLoading(false);
      return;
    }

    setItem(data);
    setColors(colorsResult.data || []);
    const first = data?.item_images?.[0]?.image_url || null;
    setActiveImage(first);

    const sortedVariants = (data?.item_variants || [])
      .map(v => ({
        ...v,
        price: v.price != null ? Number(v.price) : null,
      }))
      .sort((a, b) => {
        const ap = a.price ?? Number.POSITIVE_INFINITY;
        const bp = b.price ?? Number.POSITIVE_INFINITY;
        return ap - bp;
      });

    setVariants(sortedVariants);
    const preferred = sortedVariants.find(v => (v.stock ?? 0) > 0) || sortedVariants[0] || null;
    if (preferred) {
      setSelectedSize(preferred.size || "");
    } else {
      setSelectedSize("");
    }
    setSelectedColor("");

    const relatedResp = await fetchRelatedItems(data.category_id, data.id);
    if (!relatedResp.error) setRelatedItems(relatedResp.data || []);

    setIsLoading(false);
  }, [id]);

  useEffect(() => {
    if (id) loadItem();
  }, [id, loadItem]);

  const loadRatings = useCallback(async () => {
    const userId = session?.user?.id || null;
    const { avgRating: avg, reviews: reviewsData, userRating } = await loadAllRatings(id, userId);
    
    setAvgRating(avg);
    setReviews(reviewsData);
    if (userRating) setRating(userRating);
  }, [id, session]);

  useEffect(() => {
    if (id) loadRatings();
  }, [id, loadRatings]);

  const handleRatingSubmit = async () => {
    if (!session) {
      navigate("/login");
      return;
    }
    if (rating === 0) return;

    setIsSubmittingReview(true);
    try {
      await submitRating(id, session.user.id, rating, reviewComment);
      setReviewComment("");
      await loadRatings();
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedVariant || isOutOfStock) return;
    setIsAddingToCart(true);

    const stock = selectedVariant.stock ?? null;
    const safeQuantity = Math.max(1, stock != null ? Math.min(quantity, stock) : quantity);

    const colorObj = colors.find(c => c.id === selectedColor) || null;

    // Simulation d'un délai pour l'UX
    setTimeout(() => {
      addItem({
        item: {
          ...item,
          selectedColor: colorObj,
          hookType: selectedHookType,
        },
        variant: {
          ...selectedVariant,
          color: colorObj?.name || selectedVariant.color,
          color_hex: colorObj?.hex_code || null,
          hookType: selectedHookType,
        },
        quantity: safeQuantity,
      });

      setIsAddingToCart(false);
      setShowNotification(true);

      // Masquer la notification après 3s
      setTimeout(() => setShowNotification(false), 3000);
    }, 500);
  };

  const renderStars = rating => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`star ${i < rating ? "filled" : ""}`}>
        ★
      </span>
    ));
  };

  if (isLoading) {
    return <LoadingMessage message={t("productDetail.loading")} />;
  }

  if (error) {
    return (
      <ErrorMessage
        title={t("productDetail.unavailableTitle")}
        message={t("productDetail.errors.load")}
        onRetry={loadItem}
      />
    );
  }

  if (!item) return <ErrorMessage title={t("productDetail.notFoundTitle")} />;

  return (
    <>
      {/* Notification */}
      {showNotification && (
        <div className="notification success">
          <div className="notification-content">
            <span>✓ {t("productDetail.notificationAdded")}</span>
            <button onClick={() => setShowNotification(false)}>×</button>
          </div>
        </div>
      )}

      <div className="product-detail">
        <div className="pd-gallery">
          <div className="pd-main-image">
            {activeImage ? (
              <img src={activeImage} alt={item.name} />
            ) : (
              <div className="pd-placeholder">{t("productDetail.imageUnavailable")}</div>
            )}
          </div>
          {item.item_images?.length > 0 && (
            <div className="pd-thumbs">
              {item.item_images.map((img, idx) => (
                <button
                  key={idx}
                  className={`pd-thumb ${activeImage === img.image_url ? "active" : ""}`}
                  onClick={() => setActiveImage(img.image_url)}
                  aria-label={`Image ${idx + 1}`}
                >
                  <img src={img.image_url} alt={`Aperçu ${idx + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pd-info">
          <div className="pd-header">
            <h1 className="pd-title">{item.name}</h1>
            <div className="pd-rating-summary">
              <div className="stars">{renderStars(Math.round(avgRating))}</div>
              <span className="rating-text">
                {t("productDetail.ratingSummary", {
                  rating: avgRating.toFixed(1),
                  count: reviews.length,
                })}
              </span>
            </div>
          </div>

          {item.description && (
            <div className="pd-desc">
              <ReactMarkdown>{item.description}</ReactMarkdown>
            </div>
          )}

          <div className="pd-price-container">
            <div className="pd-price">{priceToDisplay.toFixed(2)} €</div>
            {/* Stock and delivery badges temporarily hidden
            <div className="pd-badges">
              {selectedVariant && selectedVariant.stock != null && (
                <span className={`badge ${isOutOfStock ? 'badge--danger' : ''}`}>
                  {isOutOfStock ? t('productDetail.outOfStock') : t('productDetail.stock', { count: selectedVariant.stock })}
                </span>
              )}
              <span className="badge delivery">{t('productDetail.delivery', { date: deliveryDate })}</span>
            </div>
            */}
          </div>

          <div className="pd-options">
            <div className="option-group">
              <label>
                {t("productDetail.size")}:
                <select
                  value={selectedSize}
                  onChange={e => setSelectedSize(e.target.value)}
                  disabled={!sizeOptions.length}
                >
                  {sizeOptions.map(option => (
                    <option key={option.value || "unique"} value={option.value}>
                      {option.label}
                      {!option.hasStock ? ` (${t("productDetail.soldOut")})` : ""}
                      {!option.compatible ? ` (${t("productDetail.notCompatible")})` : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {showColorSelect && (
              <div className="option-group">
                <label>
                  {t("productDetail.color")}:
                  <select value={selectedColor} onChange={e => setSelectedColor(e.target.value)}>
                    {colorOptions.map(option => (
                      <option key={option.value || "default"} value={option.value}>
                        {option.label}
                        {!option.hasStock ? ` (${t("productDetail.soldOut")})` : ""}
                        {!option.compatible ? ` (${t("productDetail.notCompatible")})` : ""}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            <div className="option-group">
              <label>
                {t("productDetail.hookType")}:
                <select value={selectedHookType} onChange={e => setSelectedHookType(e.target.value)}>
                  <option value="default">{t('productDetail.hookTypes.default')}</option>
                  <option value="rechtsmuster">{t('productDetail.hookTypes.rechtsmuster')}</option>
                  <option value="gaensefuesschen">{t('productDetail.hookTypes.gaensefuesschen')}</option>
                </select>
              </label>
            </div>
          </div>

          <div className="pd-actions">
            <div className="qty-group">
              <label className="qty-label">{t("productDetail.quantity")}:</label>
              <div className="qty-controls">
                <button className="qty-btn" onClick={() => setQuantity(q => Math.max(1, q - 1))}>
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={e => {
                    const value = Math.max(1, Number(e.target.value) || 1);
                    const stock = selectedVariant?.stock ?? null;
                    setQuantity(stock != null ? Math.min(value, stock) : value);
                  }}
                  className="qty-input"
                />
                <button
                  className="qty-btn"
                  onClick={() =>
                    setQuantity(q => {
                      const stock = selectedVariant?.stock ?? null;
                      if (stock != null) {
                        return Math.min(stock, q + 1);
                      }
                      return q + 1;
                    })
                  }
                  disabled={
                    isOutOfStock ||
                    (selectedVariant?.stock != null && quantity >= selectedVariant.stock)
                  }
                >
                  +
                </button>
              </div>
            </div>

            <div className="cta-group">
              <button
                className={`btn primary ${isAddingToCart ? "loading" : ""}`}
                onClick={handleAddToCart}
                disabled={isAddingToCart || isOutOfStock || !selectedVariant}
              >
                {isAddingToCart ? (
                  <>
                    <div className="btn-spinner"></div>
                    {t("productDetail.adding")}
                  </>
                ) : (
                  t("productDetail.addToCart")
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Onglets de contenu */}
      <div className="product-tabs">
        <div className="tab-nav">
          <button
            className={`tab-btn ${activeTab === "details" ? "active" : ""}`}
            onClick={() => setActiveTab("details")}
          >
            {t("productDetail.tabs.details")}
          </button>
          <button
            className={`tab-btn ${activeTab === "reviews" ? "active" : ""}`}
            onClick={() => setActiveTab("reviews")}
          >
            {t("productDetail.tabs.reviews")} ({reviews.length})
          </button>
          {/* Delivery tab temporarily disabled
          <button
            className={`tab-btn ${activeTab === "delivery" ? "active" : ""}`}
            onClick={() => setActiveTab("delivery")}
          >
            {t("productDetail.tabs.delivery")}
          </button>
          */}
        </div>

        <div className="tab-content">
          {activeTab === "details" && (
            <div className="tab-panel">
              <div className="pd-meta">
                <div className="meta-item">
                  <span>{t("productDetail.meta.category")}:</span>
                  <span>{categoryPath || "—"}</span>
                </div>
                <div className="meta-item">
                  <span>{t("productDetail.meta.reference")}:</span>
                  <span>#{item.id}</span>
                </div>
                <div className="meta-item">
                  <span>{t("productDetail.meta.material")}:</span>
                  <span>{t("productDetail.materialText")}</span>
                </div>
                <div className="meta-item">
                  <span>{t("productDetail.meta.care")}:</span>
                  <span>{t("productDetail.careText")}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="tab-panel">
              <div className="reviews-section">
                <div className="rating-form">
                  <h3>{t("productDetail.reviews.title")}</h3>

                  {/* Star Rating Picker */}
                  <div className="rating-stars-picker">
                    <span className="rating-label">{t("productDetail.reviews.label")}</span>
                    <div className="stars-interactive">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button
                          key={n}
                          type="button"
                          className={`star-btn ${n <= (hoverRating || rating) ? "active" : ""}`}
                          onClick={() => setRating(n)}
                          onMouseEnter={() => setHoverRating(n)}
                          onMouseLeave={() => setHoverRating(0)}
                          aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    {rating > 0 && <span className="rating-value">{rating}/5</span>}
                  </div>

                  {/* Comment textarea */}
                  <div className="review-comment-input">
                    <textarea
                      value={reviewComment}
                      onChange={e => setReviewComment(e.target.value)}
                      placeholder={
                        t("") ||
                        "Partagez votre expérience (optionnel)..."
                      }
                      rows={3}
                      maxLength={500}
                    />
                    <span className="char-count">{reviewComment.length}/500</span>
                  </div>

                  {/* Submit button */}
                  <button
                    className={`btn primary review-submit-btn ${
                      isSubmittingReview ? "loading" : ""
                    }`}
                    onClick={handleRatingSubmit}
                    disabled={rating === 0 || isSubmittingReview}
                  >
                    {isSubmittingReview ? (
                      <>
                        <div className="btn-spinner"></div>
                        Envoi...
                      </>
                    ) : (
                      t("productDetail.reviews.submit")
                    )}
                  </button>

                  {!session && (
                    <p className="login-hint">
                      <a href="/login">
                        {t("productDetail.reviews.loginRequired") ||
                          "Connectez-vous pour laisser un avis"}
                      </a>
                    </p>
                  )}
                </div>

                <div className="reviews-list">
                  <h3>{t("productDetail.reviews.listTitle")}</h3>
                  {reviews.length > 0 ? (
                    reviews.map((review, idx) => (
                      <div key={idx} className="review-item">
                        <div className="review-header">
                          <div className="reviewer-info">
                            <strong>
                              {review.users?.email || t("productDetail.reviews.anonymous")}
                            </strong>
                            <div className="stars">{renderStars(review.rating)}</div>
                          </div>
                          <span className="review-date">
                            {new Date(review.created_at).toLocaleDateString(locale)}
                          </span>
                        </div>
                        {review.comment && <p className="review-comment">{review.comment}</p>}
                      </div>
                    ))
                  ) : (
                    <p className="no-reviews">{t("productDetail.reviews.noReviews")}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Delivery tab content temporarily disabled
          {activeTab === "delivery" && (
            <div className="tab-panel">
              <div className="delivery-info">
                <h3>{t("productDetail.deliveryInfo.title")}</h3>
                <div className="delivery-options">
                  <div className="delivery-option">
                    <strong>{t("productDetail.deliveryInfo.standard.title")}</strong>
                    <p>{t("productDetail.deliveryInfo.standard.text")}</p>
                  </div>
                  <div className="delivery-option">
                    <strong>{t("productDetail.deliveryInfo.express.title")}</strong>
                    <p>{t("productDetail.deliveryInfo.express.text")}</p>
                  </div>
                  <div className="delivery-option">
                    <strong>{t("productDetail.deliveryInfo.pickup.title")}</strong>
                    <p>{t("productDetail.deliveryInfo.pickup.text")}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          */}
        </div>
      </div>

      {/* Produits similaires */}
      {relatedItems.length > 0 && (
        <div className="related-products">
          <h2>{t("productDetail.related.title")}</h2>
          <div className="related-grid">
            {relatedItems.map(relatedItem => (
              <div key={relatedItem.id} className="related-item">
                <div className="related-image">
                  <img
                    src={relatedItem.item_images?.[0]?.image_url || "/placeholder.jpg"}
                    alt={relatedItem.name}
                    onClick={() => navigate(`/item/${relatedItem.id}`)}
                  />
                </div>
                <div className="related-info">
                  <h4>{relatedItem.name}</h4>
                  <p className="related-price">{Number(relatedItem.price).toFixed(2)} €</p>
                  <button className="btn small" onClick={() => navigate(`/item/${relatedItem.id}`)}>
                    {t("productDetail.related.cta")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
