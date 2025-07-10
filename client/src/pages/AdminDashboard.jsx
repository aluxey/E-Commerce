import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import '../styles/Admin.css'; // ⬅️ Import du fichier CSS

const AdminDashboard = () => {
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
  });
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // 🧠 Initial fetch des produits
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error('Erreur fetch produits', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // ✍️ Gérer les changements dans les inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ➕ Ajouter un produit
  const handleAddProduct = async () => {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          price: parseFloat(form.price),
          image: form.image,
        }),
      });

      if (!response.ok) throw new Error('Erreur lors de l’ajout');

      const newProduct = await response.json();
      setProducts((prev) => [...prev, newProduct]);
      setMessage('✅ Produit ajouté avec succès');
      setForm({ name: '', description: '', price: '', image: '' });
    } catch (err) {
      setMessage('❌ Erreur lors de l’ajout du produit');
      console.error(err);
    }
  };

  // 🧹 Supprimer un produit
  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce produit ?')) return;

    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erreur suppression');

      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // ✏️ Préparer l'édition
  const handleEdit = (product) => {
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
    });
    setEditingProduct(product);
    setEditModalOpen(true);
  };

  // ✅ Envoyer la mise à jour
  const handleUpdate = async () => {
    try {
      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          price: parseFloat(form.price),
          image: form.image,
        }),
      });

      if (!res.ok) throw new Error('Erreur mise à jour');

      const updated = await res.json();
      setProducts((prev) =>
        prev.map((p) => (p.id === editingProduct.id ? updated : p))
      );

      setMessage('✅ Produit modifié avec succès');
      setEditModalOpen(false);
      setEditingProduct(null);
    } catch (err) {
      setMessage('❌ Erreur modification');
      console.error(err);
    }
  };

  return (
    <div className="main">
  <div className="dashboard-container">
    <h1 className="title">Tableau de bord Admin</h1>

    {/* Statistiques fictives */}
    <div className="stats">
      <Card>
        <CardContent>
          <p className="label">Produits en stock</p>
          <p className="value">{products.length}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <p className="label">Commandes passées</p>
          <p className="value">18</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <p className="label">Revenu total</p>
          <p className="value">1 290 €</p>
        </CardContent>
      </Card>
    </div>

    {/* Ajouter un produit */}
    <Card>
      <CardContent>
        <h2 className="subtitle">Ajouter un produit</h2>
        <div className="form-row">
          <Input name="name" placeholder="Nom du produit" value={form.name} onChange={handleChange} />
          <Input name="description" placeholder="Description" value={form.description} onChange={handleChange} />
          <Input name="price" type="number" placeholder="Prix (€)" value={form.price} onChange={handleChange} />
          <Input name="image" placeholder="URL de l'image" value={form.image} onChange={handleChange} />
          <Button onClick={handleAddProduct}>Ajouter</Button>
        </div>
        {message && <p className="text-sm">{message}</p>}
      </CardContent>
    </Card>

    {/* Liste des produits */}
    <Card>
      <CardContent>
        <h2 className="subtitle">Produits existants</h2>
        {isLoading ? (
          <p>Chargement...</p>
        ) : (
          <div className="space-y-2">
            {products.map((product) => (
              <div key={product.id} className="product-item">
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-gray-500">{product.price} €</p>
                </div>
                <div className="actions">
                  <Button size="sm" onClick={() => handleEdit(product)}>Modifier</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(product.id)}>Supprimer</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>

    {/* Historique commandes fictif */}
    <Card>
      <CardContent>
        <h2 className="subtitle">Historique des commandes</h2>
        <ul className="space-y-2">
          <li className="order-item">Commande #1234 – 2 produits – 59,99 €</li>
          <li className="order-item">Commande #1235 – 1 produit – 29,99 €</li>
          <li className="order-item">Commande #1236 – 3 produits – 89,99 €</li>
        </ul>
      </CardContent>
    </Card>

    {/* 🪟 Modale de modification */}
    <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier le produit</DialogTitle>
        </DialogHeader>
        <div className="dialog-body">
          <Input name="name" placeholder="Nom" value={form.name} onChange={handleChange} />
          <Input name="description" placeholder="Description" value={form.description} onChange={handleChange} />
          <Input name="price" type="number" placeholder="Prix (€)" value={form.price} onChange={handleChange} />
          <Input name="image" placeholder="Image URL" value={form.image} onChange={handleChange} />
          <Button onClick={handleUpdate}>Enregistrer</Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</div>
  );
};

export default AdminDashboard;
