import { NavLink, Outlet } from "react-router-dom";
import PrivateRoute from "@/components/PrivateRoute";
import { useAuth } from "@/context/AuthContext";
import "../styles/Admin.css";

const navItems = [
  { to: "/admin", label: "Overview", icon: "📊", end: true },
  { to: "/admin/products", label: "Produits", icon: "🧺" },
  { to: "/admin/variants", label: "Variantes", icon: "🎯" },
  { to: "/admin/categories", label: "Catégories", icon: "🗂️" },
  { to: "/admin/orders", label: "Commandes", icon: "📦" },
  { to: "/admin/users", label: "Utilisateurs", icon: "👥" },
];

const AdminLayout = () => {
  const { userData } = useAuth();

  return (
    <PrivateRoute role="admin">
      <div className="admin-shell">
        <aside className="admin-sidebar" aria-label="Navigation administrateur">
          <div className="admin-sidebar__brand">
            <span className="admin-sidebar__title">Sabbels Admin</span>
            {userData?.email && <span className="admin-sidebar__subtitle">{userData.email}</span>}
          </div>
          <nav className="admin-nav">
            {navItems.map(item => (
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
      </div>
    </PrivateRoute>
  );
};

export default AdminLayout;
