import { useEffect, useState } from 'react';
import { supabase } from '../../supabase/supabaseClient';

export const TABLE_USERS = 'users';
export const TABLE_ORDERS = 'orders';

export default function UserManager() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filterRole, setFilterRole] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const roleOptions = [
    { value: 'user', label: 'Utilisateur' },
    { value: 'admin', label: 'Administrateur' },
    { value: 'moderator', label: 'Modérateur' },
  ];

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('users')
        .select(
          `
          *,
          orders (
            id,
            total_amount,
            status,
            created_at
          )
        `
        )
        .order('created_at', { ascending: false });

      if (filterRole !== 'all') {
        query = query.eq('role', filterRole);
      }

      const { data } = await query;

      let filteredData = data || [];

      // Filtrage par terme de recherche
      if (searchTerm) {
        filteredData = filteredData.filter(
          user =>
            user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setUsers(filteredData);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      await supabase.from(TABLE_USERS).update({ role: newRole }).eq('id', userId);

      fetchUsers();

      // Mettre à jour l'utilisateur sélectionné si c'est celui qui a été modifié
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({ ...selectedUser, role: newRole });
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du rôle:', error);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';

    try {
      await supabase.from(TABLE_USERS).update({ status: newStatus }).eq('id', userId);

      fetchUsers();

      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({ ...selectedUser, status: newStatus });
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
    }
  };

  const deleteUser = async userId => {
    if (
      !confirm(
        'Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.'
      )
    ) {
      return;
    }

    try {
      // D'abord, supprimer les commandes associées (ou les transférer)
      await supabase.from(TABLE_ORDERS).delete().eq('user_id', userId);

      // Ensuite, supprimer l'utilisateur
      await supabase.from(TABLE_USERS).delete().eq('id', userId);

      fetchUsers();

      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser(null);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert("Erreur lors de la suppression de l'utilisateur.");
    }
  };

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getUserStats = user => {
    const orders = user.orders || [];
    const totalOrders = orders.length;
    const totalSpent = orders
      .filter(order => order.status === 'delivered')
      .reduce((total, order) => total + (order.total_amount || 0), 0);

    return { totalOrders, totalSpent };
  };

  const getRoleStyle = role => {
    const colors = {
      admin: '#f44336',
      moderator: '#ff9800',
      user: '#4caf50',
    };

    return {
      backgroundColor: colors[role] || '#grey',
      color: 'white',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
    };
  };

  useEffect(() => {
    fetchUsers();
  }, [filterRole, searchTerm]);

  return (
    <div>
      <h2>Gestion des utilisateurs</h2>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)}>
          <option value="all">Tous les rôles</option>
          {roleOptions.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Rechercher par email ou nom"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <p>Chargement des utilisateurs...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Email</th>
              <th>Nom</th>
              <th>Rôle</th>
              <th>Statut</th>
              <th>Commandes</th>
              <th>Total Dépensé</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => {
              const { totalOrders, totalSpent } = getUserStats(user);
              return (
                <tr key={user.id} style={{ borderBottom: '1px solid #ccc' }}>
                  <td>{user.email}</td>
                  <td>
                    {user.first_name} {user.last_name}
                  </td>
                  <td>
                    <span style={getRoleStyle(user.role)}>{user.role}</span>
                    <br />
                    <select
                      value={user.role}
                      onChange={e => updateUserRole(user.id, e.target.value)}
                    >
                      {roleOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button onClick={() => toggleUserStatus(user.id, user.status)}>
                      {user.status === 'active' ? 'Suspendre' : 'Réactiver'}
                    </button>
                  </td>
                  <td>{totalOrders}</td>
                  <td>{totalSpent.toFixed(2)} €</td>
                  <td>
                    <button onClick={() => setSelectedUser(user)}>Détails</button>
                    <button onClick={() => deleteUser(user.id)} style={{ color: 'red' }}>
                      Supprimer
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {selectedUser && (
        <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #ccc' }}>
          <h3>Détails de l'utilisateur</h3>
          <p>
            <strong>Email :</strong> {selectedUser.email}
          </p>
          <p>
            <strong>Nom :</strong> {selectedUser.first_name} {selectedUser.last_name}
          </p>
          <p>
            <strong>Rôle :</strong> {selectedUser.role}
          </p>
          <p>
            <strong>Statut :</strong> {selectedUser.status}
          </p>
          <p>
            <strong>Commandes :</strong>
          </p>
          <ul>
            {selectedUser.orders &&
              selectedUser.orders.map(order => (
                <li key={order.id}>
                  {formatDate(order.created_at)} - {order.status} - {order.total_amount} €
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
