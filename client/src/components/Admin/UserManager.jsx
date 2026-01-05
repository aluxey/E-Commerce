import { useCallback, useEffect, useMemo, useState } from 'react';
import { listUsers, updateUserRole, deleteUser as deleteUserService } from '../../services/adminUsers';
import { pushToast } from '../../utils/toast';
import { ErrorMessage, LoadingMessage } from '../StatusMessage';

const roleOptions = [
  { value: 'client', label: 'Utilisateur' },
  { value: 'admin', label: 'Administrateur' },
];

const getRoleStyle = role => {
  const colors = {
    admin: { bg: 'var(--adm-danger)', text: 'var(--color-surface)' },
    client: { bg: 'var(--adm-success)', text: 'var(--color-surface)' },
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

export default function UserManager() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filterRole, setFilterRole] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await listUsers();
      if (fetchErr) throw fetchErr;

      let filtered = data || [];
      if (filterRole !== 'all') {
        filtered = filtered.filter(u => u.role === filterRole);
      }
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        filtered = filtered.filter(user => user.email?.toLowerCase().includes(q));
      }

      setUsers(filtered);
    } catch (err) {
      console.error('Erreur lors du chargement des utilisateurs:', err);
      setError('Impossible de charger les utilisateurs / Benutzer konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, [filterRole, searchTerm]);

  const handleRoleChange = async (userId, newRole) => {
    const { error: roleErr } = await updateUserRole(userId, newRole);
    if (roleErr) {
      pushToast({ message: 'Erreur lors du changement de rôle / Rollenwechsel fehlgeschlagen.', variant: 'error' });
    } else {
      fetchUsers();
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({ ...selectedUser, role: newRole });
      }
      pushToast({ message: 'Rôle mis à jour / Rolle aktualisiert', variant: 'success' });
    }
  };

  const handleDeleteUser = async userId => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
    const { error: delErr } = await deleteUserService(userId);
    if (delErr) {
      pushToast({ message: 'Suppression impossible / Löschen unmöglich.', variant: 'error' });
    } else {
      fetchUsers();
      if (selectedUser && selectedUser.id === userId) setSelectedUser(null);
      pushToast({ message: 'Utilisateur supprimé / Benutzer gelöscht', variant: 'success' });
    }
  };

  const formatDate = useCallback(dateString => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  const statsByUser = useMemo(() => {
    const map = new Map();
    users.forEach(user => {
      const orders = user.orders || [];
      const totalOrders = orders.length;
      const totalSpent = orders
        .filter(order => ['paid', 'shipped'].includes(order.status))
        .reduce((total, order) => total + (order.total || 0), 0);
      map.set(user.id, { totalOrders, totalSpent });
    });
    return map;
  }, [users]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  if (loading) return <LoadingMessage message="Chargement des utilisateurs..." />;
  if (error) return <ErrorMessage title="Erreur" message={error} onRetry={fetchUsers} />;

  return (
    <div>
      <h2>Gestion des utilisateurs / Benutzer</h2>

      <div className="user-filters">
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} aria-label="Filtrer par rôle / Nach Rolle filtern">
          <option value="all">Tous les rôles / Alle Rollen</option>
          {roleOptions.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Rechercher par email / Nach Email suchen"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <table className="users-table">
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
            const stats = statsByUser.get(user.id) || { totalOrders: 0, totalSpent: 0 };
            return (
                <tr key={user.id}>
                  <td>{user.email}</td>
                <td>{formatDate(user.created_at)}</td>
                <td>
                  <span style={getRoleStyle(user.role)}>{user.role}</span>
                  <br />
                  <select
                    value={user.role}
                    onChange={e => handleRoleChange(user.id, e.target.value)}
                    aria-label="Changer le rôle / Rolle ändern"
                  >
                    {roleOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{stats.totalOrders}</td>
                <td>{stats.totalSpent.toFixed(2)} €</td>
                <td>
                  <button onClick={() => setSelectedUser(user)} aria-label="Détails / Details">Détails / Details</button>
                  <button onClick={() => handleDeleteUser(user.id)} className="link-danger" aria-label="Supprimer / Löschen">
                    Supprimer / Löschen
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

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
          <h3>Détails de l'utilisateur / Nutzerdetails</h3>
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
