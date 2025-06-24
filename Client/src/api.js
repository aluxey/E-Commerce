const API_URL = 'http://localhost:3001';

export async function getItems() {
  const res = await fetch(`${API_URL}/items`);
  if (!res.ok) throw new Error('Erreur lors du chargement des produits');
  return res.json();
}

export async function getItem(id) {
  const res = await fetch(`${API_URL}/items/${id}`);
  if (!res.ok) throw new Error('Erreur lors du chargement du produit');
  return res.json();
}
