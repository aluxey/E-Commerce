import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { listUsers, updateUserRole, deleteUser as deleteUserService } from '../../services/adminUsers';
import { pushToast } from '../../utils/toast';
import { ErrorMessage, LoadingMessage } from '../StatusMessage';

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
  const { t, i18n } = useTranslation();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filterRole, setFilterRole] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const roleOptions = useMemo(
    () => [
      { value: 'client', label: t('admin.users.roles.client') },
      { value: 'admin', label: t('admin.users.roles.admin') },
    ],
    [t]
  );

  const roleLabelMap = useMemo(
    () =>
      roleOptions.reduce((acc, opt) => {
        acc[opt.value] = opt.label;
        return acc;
      }, {}),
    [roleOptions]
  );

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
      console.error('User loading error:', err);
      setError(t('admin.users.error.load'));
    } finally {
      setLoading(false);
    }
  }, [filterRole, searchTerm, t]);

  const handleRoleChange = async (userId, newRole) => {
    const { error: roleErr } = await updateUserRole(userId, newRole);
    if (roleErr) {
      pushToast({ message: t('admin.users.error.roleUpdate'), variant: 'error' });
    } else {
      fetchUsers();
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({ ...selectedUser, role: newRole });
      }
      pushToast({ message: t('admin.users.success.roleUpdate'), variant: 'success' });
    }
  };

  const handleDeleteUser = async userId => {
    if (!window.confirm(t('admin.users.confirm.delete'))) return;
    const { error: delErr } = await deleteUserService(userId);
    if (delErr) {
      pushToast({ message: t('admin.users.error.delete'), variant: 'error' });
    } else {
      fetchUsers();
      if (selectedUser && selectedUser.id === userId) setSelectedUser(null);
      pushToast({ message: t('admin.users.success.delete'), variant: 'success' });
    }
  };

  const formatDate = useCallback(dateString => {
    const locale = i18n.language === 'fr' ? 'fr-FR' : 'de-DE';
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, [i18n.language]);

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

  if (loading) return <LoadingMessage message={t('admin.users.loading')} />;
  if (error) return <ErrorMessage title={t('status.error')} message={error} onRetry={fetchUsers} />;

  return (
    <div>
      <h2>{t('admin.users.manager.title')}</h2>

      <div className="user-filters">
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} aria-label={t('admin.users.manager.filterByRole')}>
          <option value="all">{t('admin.users.manager.allRoles')}</option>
          {roleOptions.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder={t('admin.users.manager.searchPlaceholder')}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <table className="users-table">
        <thead>
          <tr>
            <th>{t('admin.users.manager.columns.email')}</th>
            <th>{t('admin.users.manager.columns.createdAt')}</th>
            <th>{t('admin.users.manager.columns.role')}</th>
            <th>{t('admin.users.manager.columns.orders')}</th>
            <th>{t('admin.users.manager.columns.totalSpent')}</th>
            <th>{t('admin.users.manager.columns.actions')}</th>
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
                  <span style={getRoleStyle(user.role)}>{roleLabelMap[user.role] || user.role}</span>
                  <br />
                  <select
                    value={user.role}
                    onChange={e => handleRoleChange(user.id, e.target.value)}
                    aria-label={t('admin.users.manager.changeRole')}
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
                  <button onClick={() => setSelectedUser(user)} aria-label={t('admin.users.manager.details')}>
                    {t('admin.users.manager.details')}
                  </button>
                  <button onClick={() => handleDeleteUser(user.id)} className="link-danger" aria-label={t('admin.common.delete')}>
                    {t('admin.common.delete')}
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
          <h3>{t('admin.users.manager.userDetailsTitle')}</h3>
          <p>
            <strong>{t('admin.users.manager.labels.email')}</strong> {selectedUser.email}
          </p>
          <p>
            <strong>{t('admin.users.manager.labels.createdAt')}</strong> {formatDate(selectedUser.created_at)}
          </p>
          <p>
            <strong>{t('admin.users.manager.labels.role')}</strong> {roleLabelMap[selectedUser.role] || selectedUser.role}
          </p>
          <p>
            <strong>{t('admin.users.manager.labels.orders')}</strong>
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
