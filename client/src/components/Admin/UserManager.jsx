import { useCallback, useEffect, useState } from 'react';
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
    { value: 'client', label: 'Utilisateur' },
    { value: 'admin', label: 'Administrateur' },
  ];

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('users')
        .select(
          `
          id,
          email,
          role,
          created_at,
          orders (
            id,
            status,
            total,
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
        const q = searchTerm.toLowerCase();
        filteredData = filteredData.filter(user => user.email?.toLowerCase().includes(q));
      }

      setUsers(filteredData);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  }, [filterRole, searchTerm]);

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

  // Statut utilisateur (active/suspended) non géré dans le schéma actuel

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
      .filter(order => ['paid', 'shipped'].includes(order.status))
      .reduce((total, order) => total + (order.total || 0), 0);

    return { totalOrders, totalSpent };
  };

  const getRoleStyle = role => {
    const colors = {
      admin: { bg: 'var(--adm-danger)', text: 'var(--color-surface)' },
      moderator: { bg: 'var(--color-warning)', text: 'var(--color-text-primary)' },
      user: { bg: 'var(--adm-success)', text: 'var(--color-surface)' },
    };

    const palette = colors[role] || { bg: 'var(--color-complementary)', text: 'var(--color-text-primary)' };

    return {
      backgroundColor: palette.bg,
      color: palette.text,
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: 600,
    };
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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
          placeholder="Rechercher par email"
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
              <th>Créé le</th>
              <th>Rôle</th>
              <th>Commandes</th>
              <th>Total Dépensé</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => {
              const { totalOrders, totalSpent } = getUserStats(user);
              return (
                <tr
                  key={user.id}
                  style={{
                    borderBottom: '1px solid var(--adm-border)',
                  }}
                >
                  <td>{user.email}</td>
                  <td>{formatDate(user.created_at)}</td>
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
                  <td>{totalOrders}</td>
                  <td>{totalSpent.toFixed(2)} €</td>
                  <td>
                    <button onClick={() => setSelectedUser(user)}>Détails</button>
                    <button onClick={() => deleteUser(user.id)} style={{ color: 'var(--adm-danger)' }}>
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
        <div
          style={{
            marginTop: '2rem',
            padding: '1rem',
            border: '1px solid var(--adm-border)',
            borderRadius: 'var(--rad)',
            background: 'var(--adm-surface)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h3>Détails de l'utilisateur</h3>
          <p>
            <strong>Email :</strong> {selectedUser.email}
          </p>
          <p>
            <strong>Créé le :</strong> {formatDate(selectedUser.created_at)}
          </p>
          <p>
            <strong>Rôle :</strong> {selectedUser.role}
          </p>
          <p>
            <strong>Commandes :</strong>
          </p>
          <ul>
            {selectedUser.orders &&
              selectedUser.orders.map(order => (
                <li key={order.id}>
                  {formatDate(order.created_at)} - {order.status} - {order.total ?? 0} €
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
