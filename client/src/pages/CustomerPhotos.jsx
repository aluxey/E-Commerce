import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import CustomerPhotoWall from "../components/CustomerPhotoWall";
import { LoadingMessage, ErrorMessage } from "../components/StatusMessage";
import { fetchVisiblePhotos } from "../services/customerPhotos";
import "../styles/customer-photos.css";

/**
 * Page publique du mur de photos clients (/photos).
 * Affiche toutes les photos visibles dans une grille masonry.
 */
export default function CustomerPhotos() {
  const { t } = useTranslation();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data, error: fetchErr } = await fetchVisiblePhotos();
      if (fetchErr) {
        setError(true);
      } else {
        setPhotos(data || []);
      }
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="photo-wall-page container">
      <div className="section-header">
        <div>
          <span className="eyebrow">{t("customerPhotos.eyebrow")}</span>
          <h1>{t("customerPhotos.title")}</h1>
          <p className="color-text-muted">{t("customerPhotos.subtitle")}</p>
        </div>
      </div>

      {loading && <LoadingMessage />}
      {error && <ErrorMessage message={t("customerPhotos.loadError")} />}
      {!loading && !error && <CustomerPhotoWall photos={photos} />}
    </div>
  );
}
