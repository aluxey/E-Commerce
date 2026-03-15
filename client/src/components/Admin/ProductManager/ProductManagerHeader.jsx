import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ProductManagerHeader({ productCount, searchQuery, setSearchQuery, onCreate }) {
  const { t } = useTranslation();

  return (
    <div className="manager-header">
      <div className="manager-header__left">
        <h2>{t("admin.products.manager.title")}</h2>
        <span className="product-count">{t("admin.products.manager.count", { count: productCount })}</span>
      </div>

      <div className="manager-header__right">
        <div className="search-box">
          <input
            type="search"
            placeholder={t("admin.products.search")}
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
          />
          <span className="search-icon">
            <Search size={18} />
          </span>
        </div>

        <button className="btn btn-primary" onClick={onCreate}>
          {t("admin.products.newProduct")}
        </button>
      </div>
    </div>
  );
}
