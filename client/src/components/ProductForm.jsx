import { useState } from 'react';
import { supabase } from "../supabase/supabaseClient";

const ProductForm = () => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('items').insert({
      name,
      price: parseFloat(price),
      description,
    });
    if (error) setMessage(error.message);
    else {
      setMessage('Produit ajouté !');
      setName('');
      setPrice('');
      setDescription('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Nom" className="input" required />
      <input value={price} onChange={e => setPrice(e.target.value)} placeholder="Prix" className="input" required />
      <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" className="input" />
      <button type="submit" className="btn-primary">Ajouter</button>
      {message && <p>{message}</p>}
    </form>
  );
};

export default ProductForm;
