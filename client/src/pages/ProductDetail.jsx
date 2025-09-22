import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useContext, useCallback, useMemo } from 'react';
import { supabase } from '../supabase/supabaseClient';
import '../styles/itemPage.css';
import { CartContext } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function ItemDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [activeImage, setActiveImage] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [variants, setVariants] = useState([]);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [rating, setRating] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [activeTab, setActiveTab] = useState('details');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [relatedItems, setRelatedItems] = useState([]);
  const [deliveryDate, setDeliveryDate] = useState('');

  const navigate = useNavigate();
  const { addItem } = useContext(CartContext);
  const { session } = useAuth();

  const sizeOptions = useMemo(() => {
    if (!variants.length) return [];
    const map = new Map();
    for (const v of variants) {
      const key = v.size || '';
      const label = v.size || 'Unique';
      const entry = map.get(key) || { value: key, label, hasStock: false, compatible: true };
      const inStock = v.stock == null || v.stock > 0;
      if (inStock) entry.hasStock = true;
      map.set(key, entry);
    }
    // Set compatibility against currently selected color when color dimension exists
    const result = Array.from(map.values());
    if (variants.length) {
      const colorSet = new Set(variants.map(v => (v.color || '').trim()));
      colorSet.delete('');
      const hasColorDim = colorSet.size > 0;
      if (hasColorDim && selectedColor !== undefined) {
        for (const opt of result) {
          opt.compatible = variants.some(
            v => (v.size || '') === opt.value && (v.color || '') === (selectedColor || '')
          );
        }
      }
    }
    return result;
  }, [variants, selectedColor]);

  const colorOptions = useMemo(() => {
    if (!variants.length) return [];
    const map = new Map();
    for (const v of variants) {
      const key = v.color || '';
      const label = v.color || 'Sans couleur';
      const entry = map.get(key) || { value: key, label, hasStock: false, compatible: true };
      const inStock = v.stock == null || v.stock > 0;
      if (inStock) entry.hasStock = true;
      map.set(key, entry);
    }
    const result = Array.from(map.values());
    // Set compatibility against currently selected size when size dimension exists
    if (variants.length) {
      const sizeSet = new Set(variants.map(v => (v.size || '').trim()));
      sizeSet.delete('');
      const hasSizeDim = sizeSet.size > 0;
      if (hasSizeDim && selectedSize !== undefined) {
        for (const opt of result) {
          opt.compatible = variants.some(
            v => (v.color || '') === opt.value && (v.size || '') === (selectedSize || '')
          );
        }
      }
    }
    return result;
  }, [variants, selectedSize]);

  const { hasSizeDimension, hasColorDimension } = useMemo(() => {
    const sizeSet = new Set(variants.map(v => (v.size || '').trim()));
    const colorSet = new Set(variants.map(v => (v.color || '').trim()));
    sizeSet.delete('');
    colorSet.delete('');
    return {
      hasSizeDimension: sizeSet.size > 0,
      hasColorDimension: colorSet.size > 0,
    };
  }, [variants]);

  const selectedVariant = useMemo(() => {
    if (!variants.length) return null;
    // Both size and color dimensions
    if (hasSizeDimension && hasColorDimension) {
      return (
        variants.find(
          v => (v.size || '') === selectedSize && (v.color || '') === selectedColor
        ) || null
      );
    }
    // Only size dimension
    if (hasSizeDimension && !hasColorDimension) {
      return variants.find(v => (v.size || '') === selectedSize) || null;
    }
    // Only color dimension
    if (!hasSizeDimension && hasColorDimension) {
      return variants.find(v => (v.color || '') === selectedColor) || null;
    }
    // No dimension (single variant)
    return variants[0] || null;
  }, [variants, selectedSize, selectedColor, hasSizeDimension, hasColorDimension]);

  const showColorSelect = colorOptions.length > 1 || (colorOptions.length === 1 && colorOptions[0].value !== '');
  const priceToDisplay = selectedVariant?.price != null ? Number(selectedVariant.price) : item?.price != null ? Number(item.price) : 0;
  const isOutOfStock = selectedVariant
    ? selectedVariant.stock != null
      ? selectedVariant.stock <= 0
      : false
    : !variants.length;

  useEffect(() => {
    if (!colorOptions.length) {
      setSelectedColor('');
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

  useEffect(() => {
    setQuantity(1);
  }, [selectedVariant ? selectedVariant.id : null]);

  // Calculer la date de livraison estimée
  useEffect(() => {
    const deliveryDateCalc = new Date();
    deliveryDateCalc.setDate(deliveryDateCalc.getDate() + 3); // +3 jours
    setDeliveryDate(
      deliveryDateCalc.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    );
  }, []);

  useEffect(() => {
    const fetchItemWithImages = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('items')
        .select(
          `
          *,
          item_images (
            image_url
          ),
          item_variants (
            id,
            size,
            color,
            price,
            stock
          )
        `
        )
        .eq('id', id)
        .single();

      if (!error) {
        setItem(data);
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
          setSelectedSize(preferred.size || '');
          setSelectedColor(preferred.color || '');
        } else {
          setSelectedSize('');
          setSelectedColor('');
        }

        // Charger les produits similaires
        fetchRelatedItems(data.category_id);
      } else {
        console.error("Erreur lors du chargement de l'item :", error);
      }
      setIsLoading(false);
    };

    if (id) fetchItemWithImages();
  }, [id]);

  const fetchRelatedItems = async categoryId => {
    if (!categoryId) return;

    const { data } = await supabase
      .from('items')
      .select(
        `
        *,
        item_images (
          image_url
        ),
        item_variants (
          id,
          size,
          color,
          price,
          stock
        )
      `
      )
      .eq('category_id', categoryId)
      .neq('id', id)
      .limit(4);

    if (data) setRelatedItems(data);
  };

  const loadRatings = useCallback(async () => {
    // Charger les notes moyennes
    const { data, error } = await supabase.from('item_ratings').select('rating').eq('item_id', id);

    if (!error) {
      const avg = data.length ? data.reduce((sum, r) => sum + r.rating, 0) / data.length : 0;
      setAvgRating(avg);
    }

    // Charger les avis détaillés
    const { data: reviewsData } = await supabase
      .from('item_ratings')
      .select(
        `
        rating,
        comment,
        created_at,
        users (
          email
        )
      `
      )
      .eq('item_id', id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (reviewsData) setReviews(reviewsData);

    // Charger la note de l'utilisateur connecté
    if (session) {
      const { data: ur, error: urErr } = await supabase
        .from('item_ratings')
        .select('rating')
        .eq('item_id', id)
        .eq('user_id', session.user.id)
        .single();
      if (!urErr && ur) setRating(ur.rating);
    }
  }, [id, session]);

  useEffect(() => {
    if (id) loadRatings();
  }, [id, loadRatings]);

  const handleRatingSubmit = async () => {
    if (!session) {
      navigate('/login');
      return;
    }
    await supabase
      .from('item_ratings')
      .upsert({ item_id: id, user_id: session.user.id, rating }, { onConflict: 'item_id,user_id' });
    await loadRatings();
  };

  const handleAddToCart = async () => {
    if (!selectedVariant || isOutOfStock) return;
    setIsAddingToCart(true);

    const stock = selectedVariant.stock ?? null;
    const safeQuantity = Math.max(1, stock != null ? Math.min(quantity, stock) : quantity);

    // Simulation d'un délai pour l'UX
    setTimeout(() => {
      addItem({ item, variant: selectedVariant, quantity: safeQuantity });

      setIsAddingToCart(false);
      setShowNotification(true);

      // Masquer la notification après 3s
      setTimeout(() => setShowNotification(false), 3000);
    }, 500);
  };

  const renderStars = rating => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`star ${i < rating ? 'filled' : ''}`}>
        ★
      </span>
    ));
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Chargement du produit...</p>
      </div>
    );
  }

  if (!item) return <p>Produit non trouvé.</p>;

  return (
    <>
      {/* Notification */}
      {showNotification && (
        <div className="notification success">
          <div className="notification-content">
            <span>✓ Produit ajouté au panier !</span>
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
              <div className="pd-placeholder">Image indisponible</div>
            )}
          </div>
          {item.item_images?.length > 0 && (
            <div className="pd-thumbs">
              {item.item_images.map((img, idx) => (
                <button
                  key={idx}
                  className={`pd-thumb ${activeImage === img.image_url ? 'active' : ''}`}
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
                {avgRating.toFixed(1)} ({reviews.length} avis)
              </span>
            </div>
          </div>

          {item.description && <p className="pd-desc">{item.description}</p>}

          <div className="pd-price-container">
            <div className="pd-price">{priceToDisplay.toFixed(2)} €</div>
            <div className="pd-badges">
              {selectedVariant && selectedVariant.stock != null && (
                <span className={`badge ${isOutOfStock ? 'badge--danger' : ''}`}>
                  {isOutOfStock ? 'Rupture de stock' : `Stock : ${selectedVariant.stock}`}
                </span>
              )}
              <span className="badge delivery">Livraison {deliveryDate}</span>
            </div>
          </div>

          <div className="pd-options">
            <div className="option-group">
              <label>
                Taille:
                <select
                  value={selectedSize}
                  onChange={e => setSelectedSize(e.target.value)}
                  disabled={!sizeOptions.length}
                >
                  {sizeOptions.map(option => (
                    <option key={option.value || 'unique'} value={option.value}>
                      {option.label}
                      {!option.hasStock ? ' (épuisé)' : ''}
                      {!option.compatible ? ' (indisponible)' : ''}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {showColorSelect && (
              <div className="option-group">
                <label>
                  Couleur:
                  <select
                    value={selectedColor}
                    onChange={e => setSelectedColor(e.target.value)}
                  >
                    {colorOptions.map(option => (
                      <option key={option.value || 'default'} value={option.value}>
                        {option.label}
                        {!option.hasStock ? ' (épuisé)' : ''}
                        {!option.compatible ? ' (indisponible)' : ''}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
          </div>

          <div className="pd-actions">
            <div className="qty-group">
              <label className="qty-label">Quantité:</label>
              <div className="qty-controls">
                <button
                  className="qty-btn"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                >
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
                  disabled={isOutOfStock || (selectedVariant?.stock != null && quantity >= selectedVariant.stock)}
                >
                  +
                </button>
              </div>
            </div>

            <div className="cta-group">
              <button
                className={`btn primary ${isAddingToCart ? 'loading' : ''}`}
                onClick={handleAddToCart}
                disabled={isAddingToCart || isOutOfStock || !selectedVariant}
              >
                {isAddingToCart ? (
                  <>
                    <div className="btn-spinner"></div>
                    Ajout...
                  </>
                ) : (
                  'Ajouter au panier'
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
            className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Détails
          </button>
          <button
            className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            Avis ({reviews.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'delivery' ? 'active' : ''}`}
            onClick={() => setActiveTab('delivery')}
          >
            Livraison
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'details' && (
            <div className="tab-panel">
              <div className="pd-meta">
                <div className="meta-item">
                  <span>Catégorie:</span>
                  <span>{item.category_id ?? '—'}</span>
                </div>
                <div className="meta-item">
                  <span>Référence:</span>
                  <span>#{item.id}</span>
                </div>
                <div className="meta-item">
                  <span>Matière:</span>
                  <span>Coton bio 100%</span>
                </div>
                <div className="meta-item">
                  <span>Entretien:</span>
                  <span>Lavage machine 30°C</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="tab-panel">
              <div className="reviews-section">
                <div className="rating-form">
                  <h3>Donnez votre avis</h3>
                  <div className="rating-input">
                    <label>
                      Votre note:
                      <select value={rating} onChange={e => setRating(Number(e.target.value))}>
                        <option value={0}>Choisir...</option>
                        {[1, 2, 3, 4, 5].map(n => (
                          <option key={n} value={n}>
                            {n} étoile{n > 1 ? 's' : ''}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button className="btn secondary" onClick={handleRatingSubmit}>
                      Noter
                    </button>
                  </div>
                </div>

                <div className="reviews-list">
                  <h3>Avis clients</h3>
                  {reviews.length > 0 ? (
                    reviews.map((review, idx) => (
                      <div key={idx} className="review-item">
                        <div className="review-header">
                          <div className="reviewer-info">
                            <strong>{review.users?.email || 'Anonyme'}</strong>
                            <div className="stars">{renderStars(review.rating)}</div>
                          </div>
                          <span className="review-date">
                            {new Date(review.created_at).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        {review.comment && <p className="review-comment">{review.comment}</p>}
                      </div>
                    ))
                  ) : (
                    <p className="no-reviews">Aucun avis pour le moment.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'delivery' && (
            <div className="tab-panel">
              <div className="delivery-info">
                <h3>Informations de livraison</h3>
                <div className="delivery-options">
                  <div className="delivery-option">
                    <strong>Livraison standard</strong>
                    <p>3-5 jours ouvrés - Gratuite dès 50€</p>
                  </div>
                  <div className="delivery-option">
                    <strong>Livraison express</strong>
                    <p>1-2 jours ouvrés - 9,99€</p>
                  </div>
                  <div className="delivery-option">
                    <strong>Point relais</strong>
                    <p>3-4 jours ouvrés - 3,99€</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Produits similaires */}
      {relatedItems.length > 0 && (
        <div className="related-products">
          <h2>Produits similaires</h2>
          <div className="related-grid">
            {relatedItems.map(relatedItem => (
              <div key={relatedItem.id} className="related-item">
                <div className="related-image">
                  <img
                    src={relatedItem.item_images?.[0]?.image_url || '/placeholder.jpg'}
                    alt={relatedItem.name}
                    onClick={() => navigate(`/item/${relatedItem.id}`)}
                  />
                </div>
                <div className="related-info">
                  <h4>{relatedItem.name}</h4>
                  <p className="related-price">{Number(relatedItem.price).toFixed(2)} €</p>
                  <button
                    className="btn small"
                    onClick={() => navigate(`/item/${relatedItem.id}`)}
                  >
                    Voir le produit
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
