import { useEffect, useState } from 'react';
import { supabase } from '../../supabase/supabaseClient';

export const TABLE_ITEMS = 'items';

export default function ProductAdmin() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: '', price: '', stock: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.from(TABLE_ITEMS).select('*');
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des produits :', err.message);
      setError('Erreur lors du chargement des produits.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const { error } = await supabase.from(TABLE_ITEMS).insert([form]);
      if (error) throw error;
      setForm({ name: '', price: '', stock: '' });
      fetchProducts();
    } catch (err) {
      console.error('Erreur lors de l’ajout :', err.message);
      alert('Erreur lors de l’ajout du produit.');
    }
  };

  const handleDelete = async id => {
    try {
      const { error } = await supabase.from(TABLE_ITEMS).delete().eq('id', id);
      if (error) throw error;
      fetchProducts();
    } catch (err) {
      console.error('Erreur lors de la suppression :', err.message);
      alert('Erreur lors de la suppression.');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div>
      <h2>Admin Produits</h2>

      <form onSubmit={handleSubmit}>
        <input name="name" value={form.name} onChange={handleChange} placeholder="Nom" required />
        <input
          name="price"
          value={form.price}
          onChange={handleChange}
          placeholder="Prix"
          required
        />
        <input
          name="stock"
          value={form.stock}
          onChange={handleChange}
          placeholder="Stock"
          required
        />
        <button type="submit">Ajouter</button>
      </form>

      {loading && <p>Chargement en cours...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && products.length === 0 && <p>Aucun produit disponible.</p>}

      <ul>
        {Array.isArray(products) &&
          products.map(p => (
            <li key={p.id}>
              {p.name} - {p.price}€ - Stock: {p.stock}
              <button onClick={() => handleDelete(p.id)}>Supprimer</button>
            </li>
          ))}
      </ul>
    </div>
  );
}
