/**
 * InfoStep - Product basic information form
 */
export default function InfoStep({ form, handleChange, groupedCategories, orphanCategories, categoryName }) {
  return (
    <div className="wizard-step">
      <div className="step-header">
        <h3>Informations de base</h3>
        <p className="step-description">Commençons par les informations essentielles de votre produit.</p>
      </div>

      <div className="form-grid">
        <div className="form-group form-group--full">
          <label>Nom du produit <span className="required">*</span></label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Ex: Panier tressé coton bio"
            className="input-lg"
            required
          />
        </div>

        <div className="form-row two-col">
          <div className="form-group">
            <label>Catégorie</label>
            <select name="category_id" value={form.category_id || ''} onChange={handleChange}>
              <option value="">Choisir une catégorie...</option>
              {groupedCategories.map(group => (
                <optgroup key={group.parent.id} label={group.parent.name}>
                  <option value={group.parent.id}>{group.parent.name} — toutes</option>
                  {group.children.map(sub => (
                    <option key={sub.id} value={sub.id}>
                      {group.parent.name} › {sub.name}
                    </option>
                  ))}
                </optgroup>
              ))}
              {orphanCategories.length > 0 && (
                <optgroup label="Autres">
                  {orphanCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {categoryName(cat.id)}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <div className="form-group">
            <label>Statut</label>
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="active">Actif (visible)</option>
              <option value="draft">Brouillon</option>
              <option value="archived">Archivé</option>
            </select>
          </div>
        </div>

        <div className="form-group form-group--full">
          <label>Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Décrivez votre produit en quelques phrases..."
            rows={4}
          />
        </div>
      </div>
    </div>
  );
}
