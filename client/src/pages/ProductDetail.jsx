import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext, useCallback } from "react";
import { supabase } from "../supabase/supabaseClient";
import "../styles/Item.css";
import { CartContext } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export default function ItemDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [activeImage, setActiveImage] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [rating, setRating] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const navigate = useNavigate();
  const { addItem } = useContext(CartContext);
  const { session } = useAuth();

  useEffect(() => {
    const fetchItemWithImages = async () => {
      const { data, error } = await supabase
        .from("items")
        .select(`
          *,
          item_images (
            image_url
          )
        `)
        .eq("id", id)
        .single();

      if (!error) {
        setItem(data);
        const first = data?.item_images?.[0]?.image_url || null;
        setActiveImage(first);
        setSelectedSize(data.sizes?.[0] || "S");
        setSelectedColor(data.colors?.[0] || "BLEU");
      } else {
        console.error("Erreur lors du chargement de l'item :", error);
      }
    };

    if (id) fetchItemWithImages();
  }, [id]);

  const loadRatings = useCallback(async () => {
    const { data, error } = await supabase
      .from("item_ratings")
      .select("rating")
      .eq("item_id", id);
    if (!error) {
      const avg = data.length
        ? data.reduce((sum, r) => sum + r.rating, 0) / data.length
        : 0;
      setAvgRating(avg);
    }
    if (session) {
      const { data: ur, error: urErr } = await supabase
        .from("item_ratings")
        .select("rating")
        .eq("item_id", id)
        .eq("user_id", session.user.id)
        .single();
      if (!urErr && ur) setRating(ur.rating);
    }
  }, [id, session]);

  useEffect(() => {
    if (id) loadRatings();
  }, [id, loadRatings]);

  const handleRatingSubmit = async () => {
    if (!session) {
      navigate("/login");
      return;
    }
    await supabase.from("item_ratings").upsert(
      { item_id: id, user_id: session.user.id, rating },
      { onConflict: "item_id,user_id" }
    );
    await loadRatings();
  };

  if (!item) return <p>Chargement...</p>;

  return (
    <div className="product-detail">
      <div className="pd-gallery">
        <div className="pd-main-image">
          {activeImage ? (
            <img src={activeImage} alt={item.name} />
          ) : (
            <div className="pd-placeholder">Image indisponible</div>
          )}
        </div>
        {item.item_images?.length ? (
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
        ) : null}
      </div>

      <div className="pd-info">
        <h1 className="pd-title">{item.name}</h1>
        {item.description ? (
          <p className="pd-desc">{item.description}</p>
        ) : null}
        <div className="pd-price">{Number(item.price).toFixed(2)} €</div>

        <div className="pd-options">
          <label>
            Taille:
            <select
              value={selectedSize}
              onChange={e => setSelectedSize(e.target.value)}
            >
              {item.sizes?.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label>
            Couleur:
            <select
              value={selectedColor}
              onChange={e => setSelectedColor(e.target.value)}
            >
              {item.colors?.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="pd-actions">
          <div className="qty-group" aria-label="Quantité">
            <button
              className="qty-btn"
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              aria-label="Diminuer la quantité"
            >
              −
            </button>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={e => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              className="qty-input"
            />
            <button
              className="qty-btn"
              onClick={() => setQuantity(q => q + 1)}
              aria-label="Augmenter la quantité"
            >
              +
            </button>
          </div>
          <div className="cta-group">
            <button
              className="btn primary"
              onClick={() => {
                // Ajoute N fois pour rester compatible avec CartContext actuel
                for (let i = 0; i < quantity; i++)
                  addItem({ ...item, selectedSize, selectedColor });
              }}
            >
              Ajouter au panier
            </button>
            <button
              className="btn secondary"
              onClick={() => {
                for (let i = 0; i < quantity; i++)
                  addItem({ ...item, selectedSize, selectedColor });
                navigate('/cart');
              }}
            >
              Acheter maintenant
            </button>
          </div>
        </div>

        <div className="pd-meta">
          <div>Catégorie: {item.category_id ?? '—'}</div>
          <div>Référence: #{item.id}</div>
        </div>

        <div className="pd-rating">
          <div>Note moyenne: {avgRating.toFixed(1)} / 5</div>
          <div className="rate-form">
            <label>
              Votre note:
              <select
                value={rating}
                onChange={e => setRating(Number(e.target.value))}
              >
                <option value={0}>Choisir...</option>
                {[1, 2, 3, 4, 5].map(n => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <button className="btn secondary" onClick={handleRatingSubmit}>
              Noter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
