const { BrowserRouter, Routes, Route, Link } = ReactRouterDOM;

const AddToCartButton = () => (
  <button className="btn btn-primary add-to-cart" onClick={() => alert('Fonction panier non implémentée.')}>Ajouter au panier</button>
);

function NavBar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">E-Shop</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item"><Link className="nav-link" to="/shop">Boutique</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/cart">Panier</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/about">À propos</Link></li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="bg-dark text-white text-center py-3 mt-auto">
      <p className="mb-0">&copy; 2024 E-Shop - Interface de démonstration</p>
    </footer>
  );
}

function Home() {
  return (
    <>
      <header className="bg-light py-5">
        <div className="container text-center">
          <h1 className="display-4">Bienvenue sur notre boutique</h1>
          <p className="lead">Découvrez nos produits du moment</p>
        </div>
      </header>
      <div className="container my-5">
        <div className="row g-4">
          {[1,2,3].map(n => (
            <div className="col-md-4" key={n}>
              <div className="card h-100">
                <img src={`https://via.placeholder.com/350x200`} className="card-img-top" alt={`Produit ${n}`} />
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">{`Produit ${n}`}</h5>
                  <p className="card-text">Un produit de démonstration.</p>
                  <AddToCartButton />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function Shop() {
  const products = ['A', 'B', 'C', 'D'];
  return (
    <div className="container my-5">
      <h1 className="mb-4">Nos produits</h1>
      <div className="row g-4">
        {products.map(p => (
          <div className="col-md-3" key={p}>
            <div className="card h-100">
              <img src="https://via.placeholder.com/300x180" className="card-img-top" alt={`Produit ${p}`} />
              <div className="card-body d-flex flex-column">
                <h5 className="card-title">{`Produit ${p}`}</h5>
                <p className="card-text">Petit descriptif du produit {p}.</p>
                <Link to="/product" className="btn btn-outline-primary mt-auto">Voir</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Product() {
  return (
    <div className="container my-5">
      <div className="row">
        <div className="col-md-6">
          <img className="img-fluid" src="https://via.placeholder.com/600x400" alt="Produit détaillé" />
        </div>
        <div className="col-md-6">
          <h1>Nom du produit</h1>
          <p className="lead">Ici se trouve une description détaillée du produit.</p>
          <p className="h4">49,99 €</p>
          <AddToCartButton />
        </div>
      </div>
    </div>
  );
}

function Cart() {
  return (
    <div className="container my-5">
      <h1 className="mb-4">Votre panier</h1>
      <table className="table">
        <thead>
          <tr>
            <th>Produit</th>
            <th>Quantité</th>
            <th>Prix</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Produit 1</td>
            <td>1</td>
            <td>19,99 €</td>
            <td>19,99 €</td>
          </tr>
          <tr>
            <td>Produit 2</td>
            <td>2</td>
            <td>15,00 €</td>
            <td>30,00 €</td>
          </tr>
        </tbody>
      </table>
      <div className="text-end">
        <p className="h5">Total panier : 49,99 €</p>
        <a href="#" className="btn btn-success mt-2">Valider la commande</a>
      </div>
    </div>
  );
}

function About() {
  return (
    <div className="container my-5">
      <h1 className="mb-4">À propos de notre boutique</h1>
      <p className="mb-5">Cette boutique fictive est un exemple d'application e-commerce pour démontrer l'utilisation de React.</p>
      <h2>Contact</h2>
      <form>
        <div className="mb-3">
          <label htmlFor="name" className="form-label">Nom</label>
          <input type="text" className="form-control" id="name" />
        </div>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">Email</label>
          <input type="email" className="form-control" id="email" />
        </div>
        <div className="mb-3">
          <label htmlFor="message" className="form-label">Message</label>
          <textarea className="form-control" id="message" rows="4"></textarea>
        </div>
        <button type="submit" className="btn btn-primary">Envoyer</button>
      </form>
    </div>
  );
}

function Layout({ children }) {
  return (
    <div className="d-flex flex-column min-vh-100">
      <NavBar />
      <div className="flex-grow-1">
        {children}
      </div>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product" element={<Product />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
