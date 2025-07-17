import { useEffect, useState } from 'react';
import { supabase } from '../supabase/supabaseClient';

export default function ProductAdmin() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: '', price: '', stock: '' });

  const fetchProducts = async () => {
    const { data } = await supabase.from('item').select('*');
    setProducts(data);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await supabase.from('item').insert([form]);
    setForm({ name: '', price: '', stock: '' });
    fetchProducts();
  };

  const handleDelete = async (id) => {
    await supabase.from('item').delete().eq('id', id);
    fetchProducts();
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div>
      <h2>Admin Produits</h2>
      <form onSubmit={handleSubmit}>
        <input name="name" value={form.name} onChange={handleChange} placeholder="Nom" required />
        <input name="price" value={form.price} onChange={handleChange} placeholder="Prix" required />
        <input name="stock" value={form.stock} onChange={handleChange} placeholder="Stock" required />
        <button type="submit">Ajouter</button>
      </form>

      <ul>
        {products.map((p) => (
          <li key={p.id}>
            {p.name} - {p.price}€ - Stock: {p.stock}
            <button onClick={() => handleDelete(p.id)}>Supprimer</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
