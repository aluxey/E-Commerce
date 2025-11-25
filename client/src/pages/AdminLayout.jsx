import { NavLink, Outlet } from "react-router-dom";
import PrivateRoute from "@/components/PrivateRoute";
import { useAuth } from "@/context/AuthContext";
import ToastHost from "@/components/ToastHost";
import "../styles/Admin.css";
import "../styles/adminForms.css";
import { useTranslation } from "react-i18next";

const navItems = (t) => [
  { to: "/admin", label: t("admin.nav.overview"), icon: "📊", end: true },
  { to: "/admin/products", label: t("admin.nav.products"), icon: "🧺" },
  { to: "/admin/variants", label: t("admin.nav.variants"), icon: "🎯" },
  { to: "/admin/colors", label: t("admin.nav.colors"), icon: "🎨" },
  { to: "/admin/categories", label: t("admin.nav.categories"), icon: "🗂️" },
  { to: "/admin/orders", label: t("admin.nav.orders"), icon: "📦" },
  { to: "/admin/users", label: t("admin.nav.users"), icon: "👥" },
];

const AdminLayout = () => {
  const { userData } = useAuth();
  const { t } = useTranslation();
  const items = navItems(t);

  return (
    <PrivateRoute role="admin">
      <div className="admin-shell">
        <aside className="admin-sidebar" aria-label={t("admin.nav.label")}>
          <div className="admin-sidebar__brand">
            <span className="admin-sidebar__title">{t("admin.nav.brand")}</span>
            {userData?.email && <span className="admin-sidebar__subtitle">{userData.email}</span>}
          </div>
          <nav className="admin-nav">
            {items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `admin-nav__link${isActive ? " is-active" : ""}`}
              >
                <span className="admin-nav__icon" aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="admin-shell__content">
          <div className="admin-container">
            <Outlet />
          </div>
        </div>
        <ToastHost />
      </div>
    </PrivateRoute>
  );
};

export default AdminLayout;
