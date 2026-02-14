import CustomerPhotoManager from "@/components/Admin/CustomerPhotoManager";
import { useTranslation } from "react-i18next";
import "../styles/Admin.css";

/**
 * Page admin pour la gestion des photos clients.
 * Wrapper autour du composant CustomerPhotoManager.
 */
const AdminCustomerPhotos = () => {
  const { t } = useTranslation();

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <span className="eyebrow">{t("admin.customerPhotos.eyebrow", "Galerie")}</span>
          <h1>{t("admin.customerPhotos.title", "Photos clients")}</h1>
          <p className="admin-subtitle">{t("admin.customerPhotos.subtitle", "Gérez les photos de vos clients à afficher sur le site.")}</p>
        </div>
      </div>
      <div className="admin-card">
        <CustomerPhotoManager />
      </div>
    </div>
  );
};

export default AdminCustomerPhotos;
