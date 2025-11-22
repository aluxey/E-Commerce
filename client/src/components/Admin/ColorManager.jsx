import { useEffect, useMemo, useState } from 'react';
import { countColorUsage, deleteColor, listColors, upsertColor } from '@/services/adminColors';
import { pushToast } from '../ToastHost';
import { ErrorMessage, LoadingMessage } from '../StatusMessage';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';

const defaultForm = { name: '', code: '', hex_code: '#1E90FF' };
const DRAFT_KEY = 'admin-color-draft';

const normalizeHex = value => {
  if (!value) return '#000000';
  const cleaned = value.trim();
  if (!cleaned) return '#000000';
  const withHash = cleaned.startsWith('#') ? cleaned : `#${cleaned}`;
  return withHash.toUpperCase();
};

const normalizeCode = value => {
  const base = (value || '').trim().toLowerCase();
  const cleaned = base
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_-]/g, '')
    .replace(/_+/g, '_')
    .replace(/-+/g, '-');
  return cleaned;
};

export default function ColorManager() {
  const [colors, setColors] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  const currentHex = useMemo(() => normalizeHex(form.hex_code), [form.hex_code]);

  const fetchColors = async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await listColors();
    if (fetchError) {
      setError('Impossible de charger les couleurs / Farben können nicht geladen werden.');
      setColors([]);
    } else {
      setColors(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    const draftRaw = localStorage.getItem(DRAFT_KEY);
    if (draftRaw) {
      try {
        const draft = JSON.parse(draftRaw);
        if (draft && typeof draft === 'object') {
          setForm({
            name: draft.name || '',
            code: draft.code || '',
            hex_code: draft.hex_code || '#1E90FF',
          });
          setIsDirty(true);
        }
      } catch (err) {
        console.warn('Impossible de charger le brouillon couleurs', err);
      }
    }
    fetchColors();
  }, []);

  useUnsavedChanges(isDirty, 'Des modifications sur les couleurs ne sont pas sauvegardées. Quitter la page ?');

  useEffect(() => {
    if (!isDirty) return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
  }, [form, isDirty]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => {
      const next = { ...prev, [name]: value };
      // auto-génère un code si le champ code est vide ou dérivé de l'ancien nom
      if (name === 'name') {
        const currentGenerated = normalizeCode(prev.name);
        if (!prev.code || prev.code === currentGenerated) {
          next.code = normalizeCode(value);
        }
      }
      if (name === 'code') {
        next.code = normalizeCode(value);
      }
      return next;
    });
    setIsDirty(true);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      code: normalizeCode(form.code),
      hex_code: normalizeHex(form.hex_code),
    };

    if (!payload.name) {
      pushToast({ message: 'Le nom est requis / Name ist erforderlich.', variant: 'error' });
      return;
    }

    if (!payload.code) {
      pushToast({ message: 'Le code interne est requis.', variant: 'error' });
      return;
    }

    if (!/^[a-z0-9_-]+$/.test(payload.code)) {
      pushToast({ message: 'Code invalide: utilisez lettres, chiffres, tirets, underscore.', variant: 'error' });
      return;
    }

    if (!/^#([0-9A-F]{6})$/.test(payload.hex_code)) {
      pushToast({ message: 'Code couleur invalide (attendu #RRGGBB).', variant: 'error' });
      return;
    }

    setSaving(true);
    const { error: saveError } = await upsertColor(
      editingId ? { ...payload, id: editingId } : payload
    );
    setSaving(false);

    if (saveError) {
      console.error('Erreur lors de la sauvegarde de la couleur:', saveError);
      pushToast({ message: 'Sauvegarde impossible / Speichern fehlgeschlagen.', variant: 'error' });
      return;
    }

    pushToast({
      message: editingId
        ? 'Couleur mise à jour / Farbe aktualisiert.'
        : 'Couleur créée / Farbe erstellt.',
      variant: 'success',
    });
    setForm(defaultForm);
    setEditingId(null);
    setIsDirty(false);
    localStorage.removeItem(DRAFT_KEY);
    fetchColors();
  };

  const handleEdit = color => {
    setEditingId(color.id);
    setForm({ name: color.name, code: color.code, hex_code: color.hex_code });
    setIsDirty(false);
  };

  const handleDelete = async color => {
    const { count, error: usageError } = await countColorUsage(color.id);
    if (usageError) {
      console.error('Erreur lors du contrôle d’usage couleur:', usageError);
      pushToast({ message: 'Impossible de vérifier l’usage de cette couleur.', variant: 'error' });
      return;
    }
    if (count && count > 0) {
      pushToast({
        message: `Impossible de supprimer: utilisée par ${count} produit(s). Retire-la d'abord des items.`,
        variant: 'error',
      });
      return;
    }

    if (!confirm(`Supprimer la couleur "${color.name}" ?`)) return;

    const { error: deleteError } = await deleteColor(color.id);
    if (deleteError) {
      console.error('Erreur lors de la suppression:', deleteError);
      pushToast({ message: 'Suppression impossible / Löschen fehlgeschlagen.', variant: 'error' });
      return;
    }
    pushToast({ message: 'Couleur supprimée.', variant: 'success' });
    fetchColors();
  };

  const cancelEdit = () => {
    setForm(defaultForm);
    setEditingId(null);
    setIsDirty(false);
    localStorage.removeItem(DRAFT_KEY);
  };

  if (loading) return <LoadingMessage message="Chargement des couleurs..." />;
  if (error) return <ErrorMessage title="Erreur" message={error} onRetry={fetchColors} />;

  return (
    <div className="color-manager">
      <div className="color-manager__header">
        <div>
          <h2>Couleurs disponibles</h2>
          <p className="admin-subtitle">Ajoute, modifie ou supprime les coloris du catalogue.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="color-form">
        <div className="form-row two-col">
          <div className="form-group">
            <label htmlFor="color-name">Nom</label>
            <input
              id="color-name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Ex: BLEU GLACÉ"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="color-code">Code interne</label>
            <input
              id="color-code"
              name="code"
              value={form.code}
              onChange={handleChange}
              placeholder="ex: bleu_navy"
              required
            />
            <p className="input-hint">Slug technique (lettres/chiffres/tirets/underscores).</p>
          </div>
          <div className="form-group">
            <label htmlFor="color-hex">Code couleur</label>
            <div className="color-field">
              <span
                className="color-swatch"
                style={{ backgroundColor: currentHex }}
                aria-label={`Aperçu ${currentHex}`}
                title={currentHex}
              />
              <input
                id="color-hex"
                name="hex_code"
                value={form.hex_code}
                onChange={handleChange}
                placeholder="#1E90FF"
                required
              />
            </div>
            <p className="input-hint">Format #RRGGBB (6 hexadecimales).</p>
          </div>
        </div>

        <div className="form-row">
          <div className="form-buttons">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {editingId ? 'Mettre à jour' : 'Ajouter'}
            </button>
            {editingId && (
              <button type="button" className="btn btn-outline" onClick={cancelEdit}>
                Annuler
              </button>
            )}
          </div>
        </div>
      </form>

      <div className="color-table__wrapper">
        <table className="color-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Code</th>
              <th>Hex</th>
              <th>Aperçu</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {colors.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '1rem' }}>
                  Aucune couleur enregistrée.
                </td>
              </tr>
            )}
            {colors.map(color => (
              <tr key={color.id}>
                <td>{color.name}</td>
                <td><code>{color.code}</code></td>
                <td>
                  <code>{color.hex_code}</code>
                </td>
                <td>
                  <div className="color-cell">
                    <span
                      className="color-swatch"
                      style={{ backgroundColor: color.hex_code }}
                      aria-label={`Aperçu ${color.hex_code}`}
                      title={color.hex_code}
                    />
                    <span className="color-legend">Visible sur les fiches et variantes</span>
                  </div>
                </td>
                <td className="color-actions">
                  <button onClick={() => handleEdit(color)}>Éditer</button>
                  <button className="btn-outline" onClick={() => handleDelete(color)}>Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
