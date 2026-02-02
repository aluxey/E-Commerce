import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Search,
  MessageSquareQuote,
  Pencil,
  Trash2,
  Star,
  Check,
  X,
  Upload,
  Eye,
  EyeOff,
  ThumbsUp,
  ThumbsDown,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
} from "lucide-react";
import { ErrorMessage, LoadingMessage } from "../StatusMessage";
import { pushToast } from "../../utils/toast";
import {
  listTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  toggleFeatured,
  updateStatus,
  uploadTestimonialImage,
  removeTestimonialImage,
  getPublicImageUrl,
} from "@/services/adminTestimonials";
import { listProducts } from "@/services/adminProducts";

const DRAFT_KEY = "admin-testimonial-draft";
const AUTOPLAY_INTERVAL = 5000; // 5 seconds

const defaultForm = {
  author_name: "",
  content: "",
  image_url: "",
  rating: 5,
  type: "product",
  is_featured: false,
  status: "pending",
  item_id: null,
};

const STATUS_OPTIONS = ["pending", "approved", "rejected"];
const TYPE_OPTIONS = ["product", "service", "general"];
const RATING_OPTIONS = [1, 2, 3, 4, 5];

const StatusBadge = ({ status }) => {
  const colors = {
    pending: "badge-warning",
    approved: "badge-success",
    rejected: "badge-error",
  };
  return <span className={`badge ${colors[status] || ""}`}>{status}</span>;
};

const TypeBadge = ({ type }) => {
  const colors = {
    product: "badge-primary",
    service: "badge-secondary",
    general: "badge-neutral",
  };
  return <span className={`badge ${colors[type] || ""}`}>{type}</span>;
};

const StarRating = ({ rating, onChange, readonly = false }) => {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="star-rating" role="group" aria-label="Rating">
      {RATING_OPTIONS.map((star) => (
        <button
          key={star}
          type="button"
          className={`star-btn ${star <= (hovered || rating) ? "is-active" : ""}`}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          onClick={() => !readonly && onChange?.(star)}
          disabled={readonly}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
        >
          <Star size={readonly ? 14 : 20} fill={star <= (hovered || rating) ? "currentColor" : "none"} />
        </button>
      ))}
    </div>
  );
};

export default function TestimonialManager() {
  const { t } = useTranslation();
  const [testimonials, setTestimonials] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  // Carousel state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const autoplayRef = useRef(null);

  const filteredTestimonials = useMemo(() => {
    return testimonials.filter((item) => {
      const matchesSearch =
        !searchTerm ||
        item.author_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.content?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !filterStatus || item.status === filterStatus;
      const matchesType = !filterType || item.type === filterType;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [testimonials, searchTerm, filterStatus, filterType]);

  // Carousel navigation
  const totalSlides = filteredTestimonials.length;

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev >= totalSlides - 1 ? 0 : prev + 1));
  }, [totalSlides]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev <= 0 ? totalSlides - 1 : prev - 1));
  }, [totalSlides]);

  const goToSlide = useCallback((index) => {
    setCurrentIndex(index);
  }, []);

  // Reset index when filters change
  useEffect(() => {
    setCurrentIndex(0);
  }, [searchTerm, filterStatus, filterType]);

  // Autoplay logic
  useEffect(() => {
    if (isPaused || totalSlides <= 1) {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
        autoplayRef.current = null;
      }
      return;
    }

    autoplayRef.current = setInterval(goToNext, AUTOPLAY_INTERVAL);

    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
      }
    };
  }, [isPaused, goToNext, totalSlides]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [testimonialsResult, productsResult] = await Promise.all([
      listTestimonials(),
      listProducts(),
    ]);

    if (testimonialsResult.error) {
      setError(t("admin.testimonials.error.load", "Impossible de charger les t\u00e9moignages."));
      setTestimonials([]);
    } else {
      setTestimonials(testimonialsResult.data || []);
    }

    if (!productsResult.error) {
      setProducts(productsResult.data || []);
    }

    setLoading(false);
  }, [t]);

  useEffect(() => {
    const draftRaw = localStorage.getItem(DRAFT_KEY);
    if (draftRaw) {
      try {
        const draft = JSON.parse(draftRaw);
        if (draft && typeof draft === "object") {
          setForm({ ...defaultForm, ...draft });
        }
      } catch (err) {
        console.warn("Could not load testimonial draft", err);
      }
    }
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (showModal && form !== defaultForm) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    }
  }, [form, showModal]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleRatingChange = (rating) => {
    setForm((prev) => ({ ...prev, rating }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setForm((prev) => ({ ...prev, image_url: "" }));
  };

  const uploadImage = async () => {
    if (!imageFile) return form.image_url;

    setUploading(true);
    const ext = imageFile.name.split(".").pop();
    const filePath = `testimonials/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadError } = await uploadTestimonialImage(filePath, imageFile);
    setUploading(false);

    if (uploadError) {
      pushToast({
        message: t("admin.testimonials.error.upload", "Erreur lors du t\u00e9l\u00e9chargement de l'image."),
        variant: "error",
      });
      return form.image_url;
    }

    const { data } = getPublicImageUrl(filePath);
    return data?.publicUrl || "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.author_name?.trim()) {
      pushToast({
        message: t("admin.testimonials.error.authorRequired", "Le nom de l'auteur est requis."),
        variant: "error",
      });
      return;
    }

    if (!form.content?.trim()) {
      pushToast({
        message: t("admin.testimonials.error.contentRequired", "Le contenu est requis."),
        variant: "error",
      });
      return;
    }

    setSaving(true);

    // Upload image if new file selected
    const imageUrl = await uploadImage();

    const payload = {
      ...form,
      image_url: imageUrl,
      item_id: form.item_id || null,
    };

    let result;
    if (editingId) {
      result = await updateTestimonial(editingId, payload);
    } else {
      result = await createTestimonial(payload);
    }

    setSaving(false);

    if (result.error) {
      console.error("Error saving testimonial:", result.error);
      pushToast({
        message: t("admin.testimonials.error.save", "Sauvegarde impossible."),
        variant: "error",
      });
      return;
    }

    pushToast({
      message: editingId
        ? t("admin.testimonials.success.update", "T\u00e9moignage mis \u00e0 jour.")
        : t("admin.testimonials.success.create", "T\u00e9moignage cr\u00e9\u00e9."),
      variant: "success",
    });

    closeModal();
    fetchData();
  };

  const openModal = (testimonial = null) => {
    if (testimonial) {
      setForm({
        author_name: testimonial.author_name || "",
        content: testimonial.content || "",
        image_url: testimonial.image_url || "",
        rating: testimonial.rating || 5,
        type: testimonial.type || "product",
        is_featured: testimonial.is_featured || false,
        status: testimonial.status || "pending",
        item_id: testimonial.item_id || null,
      });
      setEditingId(testimonial.id);
      setImagePreview(testimonial.image_url || null);
    } else {
      setForm(defaultForm);
      setEditingId(null);
      setImagePreview(null);
    }
    setImageFile(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(defaultForm);
    setEditingId(null);
    setImageFile(null);
    setImagePreview(null);
    localStorage.removeItem(DRAFT_KEY);
  };

  const handleDelete = async (testimonial) => {
    if (!confirm(t("admin.testimonials.confirm.delete", `Supprimer ce t\u00e9moignage ?`))) return;

    // Remove image from storage if exists
    if (testimonial.image_url) {
      const path = testimonial.image_url.split("/").slice(-2).join("/");
      await removeTestimonialImage(path);
    }

    const { error: deleteError } = await deleteTestimonial(testimonial.id);
    if (deleteError) {
      pushToast({
        message: t("admin.testimonials.error.delete", "Suppression impossible."),
        variant: "error",
      });
      return;
    }
    pushToast({
      message: t("admin.testimonials.success.delete", "T\u00e9moignage supprim\u00e9."),
      variant: "success",
    });
    fetchData();
  };

  const handleToggleFeatured = async (testimonial) => {
    const { error } = await toggleFeatured(testimonial.id, !testimonial.is_featured);
    if (error) {
      pushToast({
        message: t("admin.testimonials.error.update", "Mise \u00e0 jour impossible."),
        variant: "error",
      });
      return;
    }
    fetchData();
  };

  const handleStatusChange = async (testimonial, newStatus) => {
    const { error } = await updateStatus(testimonial.id, newStatus);
    if (error) {
      pushToast({
        message: t("admin.testimonials.error.update", "Mise \u00e0 jour impossible."),
        variant: "error",
      });
      return;
    }
    pushToast({
      message: t("admin.testimonials.success.statusUpdated", "Statut mis \u00e0 jour."),
      variant: "success",
    });
    fetchData();
  };

  if (loading) return <LoadingMessage message={t("admin.common.loading", "Chargement...")} />;
  if (error) return <ErrorMessage title="Erreur" message={error} onRetry={fetchData} />;

  return (
    <div className="testimonial-manager">
      {/* Header */}
      <div className="manager-header">
        <div className="manager-header__left">
          <h2>{t("admin.testimonials.list", "Liste des t\u00e9moignages")}</h2>
          <span className="product-count">
            {filteredTestimonials.length} {t("admin.testimonials.count", "t\u00e9moignage(s)")}
          </span>
        </div>
        <div className="manager-header__right">
          <div className="search-box">
            <span className="search-icon"><Search size={18} /></span>
            <input
              type="text"
              placeholder={t("admin.common.search", "Rechercher...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            aria-label={t("admin.testimonials.filterStatus", "Filtrer par statut")}
          >
            <option value="">{t("admin.testimonials.allStatuses", "Tous les statuts")}</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {t(`admin.testimonials.statuses.${status}`, status)}
              </option>
            ))}
          </select>
          <select
            className="filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            aria-label={t("admin.testimonials.filterType", "Filtrer par type")}
          >
            <option value="">{t("admin.testimonials.allTypes", "Tous les types")}</option>
            {TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {t(`admin.testimonials.types.${type}`, type)}
              </option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={() => openModal()}>
            + {t("admin.testimonials.add", "Nouveau t\u00e9moignage")}
          </button>
        </div>
      </div>

      {/* Testimonials Carousel */}
      {filteredTestimonials.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon"><MessageSquareQuote size={48} /></div>
          <h3>{t("admin.testimonials.empty.title", "Aucun t\u00e9moignage")}</h3>
          <p>{t("admin.testimonials.empty.description", "Commencez par ajouter votre premier t\u00e9moignage.")}</p>
          <button className="btn btn-primary" onClick={() => openModal()}>
            + {t("admin.testimonials.add", "Nouveau t\u00e9moignage")}
          </button>
        </div>
      ) : (
        <div className="testimonial-carousel-wrapper">
          {/* Carousel Controls */}
          <div className="testimonial-carousel-controls">
            <div className="carousel-nav-buttons">
              <button
                className="btn-icon carousel-nav-btn"
                onClick={goToPrev}
                disabled={totalSlides <= 1}
                aria-label={t("admin.testimonials.prev", "Précédent")}
              >
                <ChevronLeft size={20} />
              </button>
              <span className="carousel-counter">
                {currentIndex + 1} / {totalSlides}
              </span>
              <button
                className="btn-icon carousel-nav-btn"
                onClick={goToNext}
                disabled={totalSlides <= 1}
                aria-label={t("admin.testimonials.next", "Suivant")}
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <button
              className={`btn-icon carousel-pause-btn ${isPaused ? "is-paused" : ""}`}
              onClick={() => setIsPaused(!isPaused)}
              aria-label={isPaused ? t("admin.testimonials.play", "Reprendre") : t("admin.testimonials.pause", "Pause")}
            >
              {isPaused ? <Play size={18} /> : <Pause size={18} />}
            </button>
          </div>

          {/* Carousel Track */}
          <div className="testimonial-carousel">
            <div
              className="testimonial-carousel__track"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {filteredTestimonials.map((testimonial) => (
                <div key={testimonial.id} className="testimonial-carousel__slide">
                  <div className="testimonial-card-admin">
                    <div className="testimonial-card-admin__image">
                      {testimonial.image_url ? (
                        <img src={testimonial.image_url} alt={testimonial.author_name} />
                      ) : (
                        <div className="testimonial-card-admin__no-image">
                          <ImageIcon size={32} />
                        </div>
                      )}
                    </div>
                    <div className="testimonial-card-admin__content">
                      <div className="testimonial-card-admin__header">
                        <div className="testimonial-card-admin__author">
                          <strong>{testimonial.author_name}</strong>
                          <StarRating rating={testimonial.rating} readonly />
                        </div>
                        <div className="testimonial-card-admin__badges">
                          <StatusBadge status={testimonial.status} />
                          <TypeBadge type={testimonial.type} />
                          {testimonial.is_featured && (
                            <span className="badge badge-featured">
                              <Star size={12} fill="currentColor" /> {t("admin.testimonials.featured", "Mis en avant")}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="testimonial-card-admin__text">{testimonial.content}</p>
                      {testimonial.items?.name && (
                        <span className="testimonial-card-admin__product">
                          {t("admin.testimonials.forProduct", "Produit")}: {testimonial.items.name}
                        </span>
                      )}
                      <div className="testimonial-card-admin__actions">
                        {testimonial.status === "pending" && (
                          <>
                            <button
                              className="btn-icon btn-approve"
                              onClick={() => handleStatusChange(testimonial, "approved")}
                              title={t("admin.testimonials.approve", "Approuver")}
                            >
                              <ThumbsUp size={16} />
                            </button>
                            <button
                              className="btn-icon btn-reject"
                              onClick={() => handleStatusChange(testimonial, "rejected")}
                              title={t("admin.testimonials.reject", "Rejeter")}
                            >
                              <ThumbsDown size={16} />
                            </button>
                          </>
                        )}
                        <button
                          className={`btn-icon ${testimonial.is_featured ? "btn-featured-active" : ""}`}
                          onClick={() => handleToggleFeatured(testimonial)}
                          title={testimonial.is_featured
                            ? t("admin.testimonials.unfeatured", "Retirer de la une")
                            : t("admin.testimonials.setFeatured", "Mettre en avant")
                          }
                        >
                          {testimonial.is_featured ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => openModal(testimonial)}
                          title={t("admin.common.edit", "Modifier")}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="btn-icon btn-remove"
                          onClick={() => handleDelete(testimonial)}
                          title={t("admin.common.delete", "Supprimer")}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination Dots */}
          {totalSlides > 1 && (
            <div className="testimonial-carousel__dots">
              {filteredTestimonials.map((_, index) => (
                <button
                  key={index}
                  className={`carousel-dot ${index === currentIndex ? "is-active" : ""}`}
                  onClick={() => goToSlide(index)}
                  aria-label={`${t("admin.testimonials.goToSlide", "Aller au témoignage")} ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {editingId
                  ? t("admin.testimonials.editTitle", "Modifier le t\u00e9moignage")
                  : t("admin.testimonials.createTitle", "Nouveau t\u00e9moignage")}
              </h3>
              <button className="btn-close" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-grid form-grid--2cols">
                {/* Author Name */}
                <div className="form-group">
                  <label htmlFor="author_name">
                    {t("admin.testimonials.form.author", "Nom de l'auteur")} <span className="required">*</span>
                  </label>
                  <input
                    id="author_name"
                    name="author_name"
                    value={form.author_name}
                    onChange={handleChange}
                    placeholder={t("admin.testimonials.form.authorPlaceholder", "Ex: Marie D.")}
                    required
                  />
                </div>

                {/* Rating */}
                <div className="form-group">
                  <label>{t("admin.testimonials.form.rating", "Note")}</label>
                  <StarRating rating={form.rating} onChange={handleRatingChange} />
                </div>

                {/* Content */}
                <div className="form-group form-group--full">
                  <label htmlFor="content">
                    {t("admin.testimonials.form.content", "T\u00e9moignage")} <span className="required">*</span>
                  </label>
                  <textarea
                    id="content"
                    name="content"
                    value={form.content}
                    onChange={handleChange}
                    placeholder={t("admin.testimonials.form.contentPlaceholder", "Le t\u00e9moignage du client...")}
                    rows={4}
                    required
                  />
                </div>

                {/* Type */}
                <div className="form-group">
                  <label htmlFor="type">{t("admin.testimonials.form.type", "Type")}</label>
                  <select id="type" name="type" value={form.type} onChange={handleChange}>
                    {TYPE_OPTIONS.map((type) => (
                      <option key={type} value={type}>
                        {t(`admin.testimonials.types.${type}`, type)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Product (optional) */}
                <div className="form-group">
                  <label htmlFor="item_id">{t("admin.testimonials.form.product", "Produit (optionnel)")}</label>
                  <select
                    id="item_id"
                    name="item_id"
                    value={form.item_id || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, item_id: e.target.value || null }))}
                  >
                    <option value="">{t("admin.testimonials.form.noProduct", "Aucun produit")}</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div className="form-group">
                  <label htmlFor="status">{t("admin.testimonials.form.status", "Statut")}</label>
                  <select id="status" name="status" value={form.status} onChange={handleChange}>
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {t(`admin.testimonials.statuses.${status}`, status)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Featured */}
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="is_featured"
                      checked={form.is_featured}
                      onChange={handleChange}
                    />
                    <span>{t("admin.testimonials.form.featured", "Mettre en avant sur le site")}</span>
                  </label>
                </div>

                {/* Image Upload */}
                <div className="form-group form-group--full">
                  <label>{t("admin.testimonials.form.image", "Image (optionnel)")}</label>
                  <div className="image-upload-zone">
                    {imagePreview ? (
                      <div className="image-preview">
                        <img src={imagePreview} alt="Preview" />
                        <button type="button" className="btn-remove-image" onClick={removeImage}>
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <label className="dropzone">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="sr-only"
                        />
                        <Upload size={24} />
                        <span>{t("admin.testimonials.form.uploadHint", "Cliquez ou glissez une image")}</span>
                      </label>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeModal}>
                  {t("admin.common.cancel", "Annuler")}
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
                  {saving || uploading
                    ? t("admin.common.loading", "Chargement...")
                    : editingId
                    ? t("admin.common.update", "Mettre \u00e0 jour")
                    : t("admin.common.create", "Cr\u00e9er")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
