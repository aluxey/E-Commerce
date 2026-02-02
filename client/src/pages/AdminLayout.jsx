import PrivateRoute from "@/components/PrivateRoute";
import ToastHost from "@/components/ToastHost";
import { useAuth } from "@/context/AuthContext";
import { useState } from 'react';
import { useTranslation } from "react-i18next";
import { NavLink, Outlet } from "react-router-dom";
import { BarChart3, ShoppingBasket, Target, Palette, FolderKanban, Package, Users, X, Menu, MessageSquareQuote } from "lucide-react";
import "../styles/Admin.css";
import "../styles/adminForms.css";

const navItems = (t) => [
  { to: "/admin", label: t("admin.nav.overview"), icon: <BarChart3 size={18} />, end: true },
  { to: "/admin/products", label: t("admin.nav.products"), icon: <ShoppingBasket size={18} /> },
  { to: "/admin/variants", label: t("admin.nav.variants"), icon: <Target size={18} /> },
  { to: "/admin/colors", label: t("admin.nav.colors"), icon: <Palette size={18} /> },
  { to: "/admin/categories", label: t("admin.nav.categories"), icon: <FolderKanban size={18} /> },
  { to: "/admin/orders", label: t("admin.nav.orders"), icon: <Package size={18} /> },
  { to: "/admin/users", label: t("admin.nav.users"), icon: <Users size={18} /> },
  { to: "/admin/testimonials", label: t("admin.nav.testimonials"), icon: <MessageSquareQuote size={18} /> },
];

const AdminLayout = () => {
  const { userData } = useAuth();
  const { t } = useTranslation();
  const items = navItems(t);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <PrivateRoute role="admin">
      <div className="admin-shell">
        <button
          className="admin-mobile-toggle"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label={isSidebarOpen ? t("admin.nav.close") : t("admin.nav.open")}
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <aside className={`admin-sidebar ${isSidebarOpen ? 'is-open' : ''}`} aria-label={t("admin.nav.label")}>
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
                onClick={() => setIsSidebarOpen(false)}
              >
                <span className="admin-nav__icon" aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        {isSidebarOpen && (
          <div className="admin-sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
        )}

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
