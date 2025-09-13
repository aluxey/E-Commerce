import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../supabase/supabaseClient';

export const TABLE_ITEMS = 'items';
const TABLE_CATEGORIES = 'categories';

export default function ProductAdmin() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const [form, setForm] = useState({
    name: '',
    price: '',
    description: '',
    category_id: '',
    sizes: ['S', 'M', 'L'],
    colors: ['BLEU', 'ORANGE', 'VERT'],
  });

  const [sizeInput, setSizeInput] = useState('');
  const [colorInput, setColorInput] = useState('');
  const [newImages, setNewImages] = useState([]); // File[]
  const [imagePreviews, setImagePreviews] = useState([]); // local URL previews

  const resetForm = () => {
    setForm({
      name: '',
      price: '',
      description: '',
      category_id: '',
      sizes: ['S', 'M', 'L'],
      colors: ['BLEU', 'ORANGE', 'VERT'],
    });
    setSizeInput('');
    setColorInput('');
    setEditingId(null);
    setNewImages([]);
    setImagePreviews([]);
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from(TABLE_ITEMS)
        .select(
          `
          id, name, price, description, category_id, sizes, colors,
          item_images ( id, image_url ),
          categories ( id, name )
        `
        )
        .order('id', { ascending: false });
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des produits :', err.message);
      setError('Erreur lors du chargement des produits.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase.from(TABLE_CATEGORIES).select('id, name').order('name');
    if (!error) setCategories(data || []);
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === 'price' ? value : value }));
  };

  const addSize = () => {
    const v = (sizeInput || '').trim();
    if (!v) return;
    setForm(prev => ({ ...prev, sizes: Array.from(new Set([...(prev.sizes || []), v])) }));
    setSizeInput('');
  };
  const removeSize = value => {
    setForm(prev => ({ ...prev, sizes: (prev.sizes || []).filter(s => s !== value) }));
  };
  const addColor = () => {
    const v = (colorInput || '').trim();
    if (!v) return;
    setForm(prev => ({ ...prev, colors: Array.from(new Set([...(prev.colors || []), v])) }));
    setColorInput('');
  };
  const removeColor = value => {
    setForm(prev => ({ ...prev, colors: (prev.colors || []).filter(c => c !== value) }));
  };

  const onFilesSelected = files => {
    const list = Array.from(files || []);
    if (!list.length) return;
    setNewImages(prev => [...prev, ...list]);
    const previews = list.map(f => URL.createObjectURL(f));
    setImagePreviews(prev => [...prev, ...previews]);
  };

  const onDrop = e => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    onFilesSelected(e.dataTransfer.files);
  };
  const onDragOver = e => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const onDragLeave = e => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const uploadImage = async (file, itemId) => {
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `${itemId}/${fileName}`;
    const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, file);
    if (uploadError) {
      console.error('Erreur upload image:', uploadError.message);
      return null;
    }
    const { data: publicData } = supabase.storage.from('product-images').getPublicUrl(filePath);
    const imageUrl = publicData?.publicUrl;
    if (!imageUrl) return null;
    const { error: dbError } = await supabase.from('item_images').insert([{ item_id: itemId, image_url: imageUrl }]);
    if (dbError) {
      console.error('Erreur enregistrement image:', dbError.message);
      return null;
    }
    return imageUrl;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        price: parseFloat(String(form.price).replace(',', '.')) || 0,
        description: form.description || null,
        category_id: form.category_id ? Number(form.category_id) : null,
        sizes: form.sizes || [],
        colors: form.colors || [],
      };

      if (!payload.name || isNaN(payload.price)) {
        alert('Nom et prix sont requis.');
        return;
      }

      if (editingId) {
        const { error } = await supabase.from(TABLE_ITEMS).update(payload).eq('id', editingId);
        if (error) throw error;
        // Upload nouvelles images si présentes
        if (newImages.length) {
          await Promise.all(newImages.map(f => uploadImage(f, editingId)));
        }
      } else {
        const { data, error } = await supabase.from(TABLE_ITEMS).insert([payload]).select().single();
        if (error) throw error;
        const itemId = data.id;
        if (newImages.length) {
          await Promise.all(newImages.map(f => uploadImage(f, itemId)));
        }
      }

      resetForm();
      fetchProducts();
    } catch (err) {
      console.error('Erreur sauvegarde produit:', err.message);
      alert("Erreur lors de l'enregistrement du produit.");
    }
  };

  const handleDelete = async id => {
    if (!confirm('Supprimer ce produit ?')) return;
    try {
      const { error } = await supabase.from(TABLE_ITEMS).delete().eq('id', id);
      if (error) throw error;
      fetchProducts();
    } catch (err) {
      console.error('Erreur lors de la suppression :', err.message);
      alert('Erreur lors de la suppression.');
    }
  };

  const handleEdit = product => {
    setEditingId(product.id);
    setForm({
      name: product.name || '',
      price: product.price ?? '',
      description: product.description || '',
      category_id: product.category_id || '',
      sizes: product.sizes || [],
      colors: product.colors || [],
    });
    setNewImages([]);
    setImagePreviews([]);
  };

  const removeNewImage = idx => {
    setNewImages(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const deleteExistingImage = async (productId, image) => {
    try {
      // Supprimer le fichier du bucket si possible (extraction du chemin)
      const marker = '/product-images/';
      const idx = image.image_url.indexOf(marker);
      if (idx !== -1) {
        const path = image.image_url.substring(idx + marker.length);
        await supabase.storage.from('product-images').remove([path]);
      }
      // Supprimer l'entrée BD
      await supabase.from('item_images').delete().eq('id', image.id);
      // Mise à jour locale
      setProducts(prev =>
        prev.map(p =>
          p.id === productId
            ? { ...p, item_images: (p.item_images || []).filter(img => img.id !== image.id) }
            : p
        )
      );
    } catch (err) {
      console.error('Erreur suppression image:', err.message);
      alert("Impossible de supprimer l'image.");
    }
  };

  const categoryName = useMemo(() => {
    const map = new Map(categories.map(c => [c.id, c.name]));
    return id => map.get(id) || '—';
  }, [categories]);

  return (
    <div className="product-manager">
      <h2>Gestion des Produits</h2>

      <form onSubmit={handleSubmit} className="product-form" style={{ display: 'grid', gap: '10px' }}>
        <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: '1fr 180px' }}>
          <input name="name" value={form.name} onChange={handleChange} placeholder="Titre" required />
          <input
            name="price"
            type="number"
            step="0.01"
            inputMode="decimal"
            value={form.price}
            onChange={handleChange}
            placeholder="Prix (€)"
            required
          />
        </div>

        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description"
        />

        <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: '1fr 1fr' }}>
          <select name="category_id" value={form.category_id || ''} onChange={handleChange}>
            <option value="">Catégorie...</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                value={sizeInput}
                onChange={e => setSizeInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSize())}
                placeholder="Ajouter une taille (Entrée)"
              />
              <button type="button" onClick={addSize}>
                +
              </button>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
              {(form.sizes || []).map(s => (
                <span key={s} style={{ padding: '4px 8px', background: '#eef0f3', borderRadius: 8 }}>
                  {s}{' '}
                  <button type="button" onClick={() => removeSize(s)} aria-label={`Retirer ${s}`}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              value={colorInput}
              onChange={e => setColorInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addColor())}
              placeholder="Ajouter une couleur (Entrée)"
            />
            <button type="button" onClick={addColor}>
              +
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
            {(form.colors || []).map(c => (
              <span key={c} style={{ padding: '4px 8px', background: '#eef0f3', borderRadius: 8 }}>
                {c}{' '}
                <button type="button" onClick={() => removeColor(c)} aria-label={`Retirer ${c}`}>
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          style={{
            border: '2px dashed #cbd5e1',
            borderRadius: 10,
            padding: 16,
            background: isDragging ? '#f9fafb' : 'transparent',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
            <span>Images: glisser-déposer des fichiers ou</span>
            <label className="btn btn-outline">
              Choisir
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={e => onFilesSelected(e.target.files)}
                style={{ display: 'none' }}
              />
            </label>
          </div>
          {(imagePreviews.length > 0 || newImages.length > 0) && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
              {imagePreviews.map((src, idx) => (
                <div key={idx} style={{ position: 'relative' }}>
                  <img src={src} alt="nouvelle" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} />
                  <button
                    type="button"
                    onClick={() => removeNewImage(idx)}
                    style={{ position: 'absolute', top: 2, right: 2 }}
                    aria-label="Supprimer l’aperçu"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="btn-group">
          <button type="submit" className="btn btn-primary">
            {editingId ? 'Mettre à jour' : 'Ajouter'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="btn btn-outline">
              Annuler
            </button>
          )}
        </div>
      </form>

      {loading && <p>Chargement en cours...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && products.length === 0 && <p className="empty-state">Aucun produit disponible.</p>}

      {products.length > 0 && (
        <div style={{ overflowX: 'auto', marginTop: 16 }}>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Image</th>
                <th>Titre</th>
                <th>Prix</th>
                <th>Catégorie</th>
                <th>Tailles</th>
                <th>Couleurs</th>
                <th>Images</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>
                    {p.item_images?.[0]?.image_url ? (
                      <img
                        src={p.item_images[0].image_url}
                        alt={p.name}
                        style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }}
                      />
                    ) : (
                      <span style={{ color: '#9ca3af' }}>—</span>
                    )}
                  </td>
                  <td>{p.name}</td>
                  <td>{Number(p.price).toFixed(2)}€</td>
                  <td>{categoryName(p.category_id)}</td>
                  <td>{(p.sizes || []).join(', ')}</td>
                  <td>{(p.colors || []).join(', ')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {(p.item_images || []).map(img => (
                        <div key={img.id} style={{ position: 'relative' }}>
                          <img
                            src={img.image_url}
                            alt="img"
                            style={{ width: 42, height: 42, objectFit: 'cover', borderRadius: 6 }}
                          />
                          <button
                            type="button"
                            onClick={() => deleteExistingImage(p.id, img)}
                            title="Supprimer"
                            style={{ position: 'absolute', top: -6, right: -6, fontSize: 12 }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className="btn-group">
                      <button onClick={() => handleEdit(p)} className="btn btn-outline">
                        Modifier
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="btn btn-danger">
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
