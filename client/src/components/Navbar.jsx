import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-3">
      <Link className="navbar-brand" to="/">Ma Boutique</Link>
      <div className="collapse navbar-collapse">
        <ul className="navbar-nav me-auto">
          <li className="nav-item">
            <Link className="nav-link" to="/shop">Boutique</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to="/cart">Panier</Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
