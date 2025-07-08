import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const AdminDashboard = () => {
  return (
    <div className="min-h-screen p-6 bg-[#f4f4f4]">
      <h1 className="text-3xl font-bold mb-6">Tableau de bord Admin</h1>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent>
            <p className="text-sm text-gray-500">Produits en stock</p>
            <p className="text-2xl font-bold">42</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-gray-500">Commandes passées</p>
            <p className="text-2xl font-bold">18</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-gray-500">Revenu total</p>
            <p className="text-2xl font-bold">1 290 €</p>
          </CardContent>
        </Card>
      </div>

      {/* Ajout d’un produit */}
      <Card className="mb-8">
        <CardContent className="space-y-4">
          <h2 className="text-xl font-semibold">Ajouter un produit</h2>
          <Input placeholder="Nom du produit" />
          <Input placeholder="Description" />
          <Input placeholder="Prix (€)" type="number" />
          <Input placeholder="URL de l'image" />
          <Button>Ajouter</Button>
        </CardContent>
      </Card>

      {/* Liste des produits (fictive) */}
      <Card className="mb-8">
        <CardContent>
          <h2 className="text-xl font-semibold mb-4">Produits existants</h2>
          <div className="space-y-2">
            <div className="flex justify-between items-center border p-2 rounded">
              <p>Produit 1</p>
              <div className="space-x-2">
                <Button variant="secondary" size="sm">Modifier</Button>
                <Button variant="destructive" size="sm">Supprimer</Button>
              </div>
            </div>
            <div className="flex justify-between items-center border p-2 rounded">
              <p>Produit 2</p>
              <div className="space-x-2">
                <Button variant="secondary" size="sm">Modifier</Button>
                <Button variant="destructive" size="sm">Supprimer</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historique des commandes */}
      <Card>
        <CardContent>
          <h2 className="text-xl font-semibold mb-4">Historique des commandes</h2>
          <ul className="space-y-2">
            <li className="border p-2 rounded">Commande #1234 – 2 produits – 59,99 €</li>
            <li className="border p-2 rounded">Commande #1235 – 1 produit – 29,99 €</li>
            <li className="border p-2 rounded">Commande #1236 – 3 produits – 89,99 €</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
