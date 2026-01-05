import { useEffect, useMemo, useState } from 'react';
import { Search, Target, Pencil, Trash2, Check, X } from 'lucide-react';
import { deleteVariant, listItemsBasic, listVariants, upsertVariant } from '../../services/adminVariants';
import { ErrorMessage, LoadingMessage } from '../StatusMessage';
import { pushToast } from '../../utils/toast';

export default function VariantManager() {
  const [variants, setVariants] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProduct, setFilterProduct] = useState('');

  const [form, setForm] = useState({
    item_id: '',
    size: '',
    price: '',
    stock: 0,
    sku: '',
  });
  const [editingId, setEditingId] = useState(null);

  const fetchVariants = async () => {
    setLoading(true);
    setError(null);
    const [variantsResp, itemsResp] = await Promise.all([listVariants(), listItemsBasic()]);
    if (variantsResp.error || itemsResp.error) {
      setError('Impossible de charger les variantes.');
      setVariants([]);
      setProducts([]);
    } else {
      setVariants(variantsResp.data || []);
      setProducts(itemsResp.data || []);
    }
    setLoading(false);
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm({
      item_id: '',
      size: '',
      price: '',
      stock: 0,
      sku: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const payload = {
        item_id: Number(form.item_id),
        size: form.size.trim(),
        stock: Math.max(0, parseInt(form.stock, 10) || 0),
        price: parseFloat(String(form.price).replace(',', '.')),
      };

      if (!payload.item_id || !payload.size || Number.isNaN(payload.price)) {
        pushToast({ message: 'Produit, taille et prix sont requis.', variant: 'error' });
        return;
      }

      if (payload.price < 0) {
        pushToast({ message: 'Le prix doit être positif.', variant: 'error' });
        return;
      }

      if (editingId) {
        const updatePayload = { ...payload };
        if (form.sku) updatePayload.sku = form.sku;
        const { error } = await upsertVariant({ ...updatePayload, id: editingId });
        if (error) throw error;
      } else {
        const skuBase = `SKU-${payload.item_id}-${payload.size}`
          .toUpperCase()
          .replace(/[^A-Z0-9-]/g, '-');
        const insertPayload = {
          ...payload,
          sku: skuBase,
        };
        const { error } = await upsertVariant(insertPayload);
        if (error) throw error;
      }

      resetForm();
      fetchVariants();
      pushToast({ message: editingId ? 'Variante mise à jour' : 'Variante créée', variant: 'success' });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      pushToast({ message: 'Impossible de sauvegarder la variante.', variant: 'error' });
    }
  };

  const handleEdit = variant => {
    setForm({
      item_id: variant.item_id,
      size: variant.size || '',
      price: variant.price,
      stock: variant.stock,
      sku: variant.sku || '',
    });
    setEditingId(variant.id);
    setShowForm(true);
  };

  const handleDelete = async id => {
    if (confirm('Supprimer cette variante ?')) {
      const { error } = await deleteVariant(id);
      if (!error) {
        fetchVariants();
        pushToast({ message: 'Variante supprimée', variant: 'success' });
      }
    }
  };

  const productById = useMemo(() => {
    const map = new Map(products.map(p => [p.id, p]));
    return id => map.get(id) || null;
  }, [products]);

  // Filtrage des variantes
  const filteredVariants = useMemo(() => {
    let result = variants;

    if (filterProduct) {
      result = result.filter(v => v.item_id === Number(filterProduct));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(v =>
        v.size?.toLowerCase().includes(q) ||
        v.sku?.toLowerCase().includes(q) ||
        v.items?.name?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [variants, filterProduct, searchQuery]);

  useEffect(() => {
    fetchVariants();
  }, []);

  if (loading) return <LoadingMessage message="Chargement des variantes..." />;
  if (error) return <ErrorMessage title="Erreur" message={error} onRetry={fetchVariants} />;

  return (
    <div className="variant-manager">
      {/* Header */}
      <div className="manager-header">
        <div className="manager-header__left">
          <h2>Gestion des Variantes</h2>
          <span className="product-count">{variants.length} variante{variants.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="manager-header__right">
          <div className="search-box">
            <input
              type="search"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <span className="search-icon"><Search size={18} /></span>
          </div>
          <select
            value={filterProduct}
            onChange={e => setFilterProduct(e.target.value)}
            className="filter-select"
          >
            <option value="">Tous les produits</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button
            className="btn btn-primary"
            onClick={() => { resetForm(); setShowForm(true); }}
          >
            + Nouvelle variante
          </button>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="wizard-overlay" onClick={e => e.target === e.currentTarget && resetForm()}>
          <div className="wizard-modal" style={{ maxWidth: '500px' }}>
            <div className="wizard-header">
              <h2>{editingId ? 'Modifier la variante' : 'Nouvelle variante'}</h2>
              <button className="btn-close" onClick={resetForm}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="wizard-content">
              <div className="form-grid">
                <div className="form-group">
                  <label>Produit <span className="required">*</span></label>
                  <select name="item_id" value={form.item_id} onChange={handleChange} required>
                    <option value="">Sélectionner un produit</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Taille <span className="required">*</span></label>
                  <input
                    name="size"
                    value={form.size}
                    onChange={handleChange}
                    placeholder="Ex: M, L, XL"
                    required
                  />
                </div>

                <div className="form-row two-col">
                  <div className="form-group">
                    <label>Prix (€) <span className="required">*</span></label>
                    <input
                      name="price"
                      type="number"
                      step="0.01"
                      value={form.price}
                      onChange={handleChange}
                      placeholder="29.90"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Stock</label>
                    <input
                      name="stock"
                      type="number"
                      min={0}
                      value={form.stock}
                      onChange={handleChange}
                      placeholder="10"
                    />
                  </div>
                </div>

                {editingId && form.sku && (
                  <div className="form-group">
                    <label>SKU</label>
                    <input
                      name="sku"
                      value={form.sku}
                      onChange={handleChange}
                      placeholder="Auto-généré"
                      disabled
                    />
                  </div>
                )}
              </div>

              <div className="wizard-footer" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--adm-border)' }}>
                <button type="button" className="btn btn-outline" onClick={resetForm}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={16} /> {editingId ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredVariants.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon"><Target size={48} /></span>
          <h3>Aucune variante</h3>
          <p>{searchQuery || filterProduct ? 'Aucun résultat pour ces filtres.' : 'Commencez par créer une variante pour vos produits.'}</p>
          {!searchQuery && !filterProduct && (
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              + Créer une variante
            </button>
          )}
        </div>
      )}

      {/* Variants Grid */}
      {filteredVariants.length > 0 && (
        <div className="variants-cards">
          {filteredVariants.map(variant => {
            const product = productById(variant.item_id) || variant.items;

            return (
              <div key={variant.id} className="variant-card">
                <div className="variant-card__header">
                  <span className="variant-product-name">{product?.name || 'N/A'}</span>
                  <div className="variant-card__actions">
                    <button
                      onClick={() => handleEdit(variant)}
                      className="btn-icon"
                      aria-label="Modifier"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(variant.id)}
                      className="btn-icon btn-remove"
                      aria-label="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="variant-card__content">
                  <div className="variant-info-row">
                    <span className="variant-size">{variant.size}</span>
                  </div>

                  <div className="variant-meta">
                    <span className="variant-price">{Number(variant.price).toFixed(2)}€</span>
                    <span className={`variant-stock ${variant.stock === 0 ? 'out-of-stock' : ''}`}>
                      Stock: {variant.stock}
                    </span>
                  </div>

                  {variant.sku && (
                    <div className="variant-sku">
                      <code>{variant.sku}</code>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
