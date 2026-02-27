import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';

/**
 * InfoStep - Product basic information form
 */
export default function InfoStep({ form, handleChange, groupedCategories, orphanCategories, categoryName }) {
  const { t } = useTranslation();
  const [showPreview, setShowPreview] = useState(false);
  return (
    <div className="wizard-step">
      <div className="step-header">
        <h3>{t('admin.products.wizard.info.title')}</h3>
        <p className="step-description">{t('admin.products.wizard.info.description')}</p>
      </div>

      <div className="form-grid">
        <div className="form-group form-group--full">
          <label>{t('admin.products.wizard.info.nameLabel')} <span className="required">*</span></label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder={t('admin.products.wizard.info.namePlaceholder')}
            className="input-lg"
            required
          />
        </div>

        <div className="form-row two-col">
          <div className="form-group">
            <label>{t('admin.products.wizard.info.categoryLabel')}</label>
            <select name="category_id" value={form.category_id || ''} onChange={handleChange}>
              <option value="">{t('admin.products.wizard.info.categoryPlaceholder')}</option>
              {groupedCategories.map(group => (
                <optgroup key={group.parent.id} label={group.parent.name}>
                  <option value={group.parent.id}>{group.parent.name} — {t('admin.products.wizard.info.allInCategory')}</option>
                  {group.children.map(sub => (
                    <option key={sub.id} value={sub.id}>
                      {group.parent.name} › {sub.name}
                    </option>
                  ))}
                </optgroup>
              ))}
              {orphanCategories.length > 0 && (
                <optgroup label={t('admin.products.wizard.info.otherCategories')}>
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
            <label>{t('admin.products.wizard.info.statusLabel')}</label>
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="active">{t('admin.products.wizard.info.statusActive')}</option>
              <option value="draft">{t('admin.products.wizard.info.statusDraft')}</option>
              <option value="archived">{t('admin.products.wizard.info.statusArchived')}</option>
            </select>
          </div>


        </div>

        <div className="form-group form-group--full">
          <div className="description-header">
            <label>{t('admin.products.wizard.info.descriptionLabel')}</label>
            <div className="description-tabs">
              <button
                type="button"
                className={`tab-btn ${!showPreview ? 'active' : ''}`}
                onClick={() => setShowPreview(false)}
              >
                {t('admin.products.wizard.info.editTab')}
              </button>
              <button
                type="button"
                className={`tab-btn ${showPreview ? 'active' : ''}`}
                onClick={() => setShowPreview(true)}
              >
                {t('admin.products.wizard.info.previewTab')}
              </button>
            </div>
          </div>
          
          {!showPreview ? (
            <>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder={t('admin.products.wizard.info.descriptionPlaceholder')}
                rows={6}
              />
              <p className="field-hint">
                {t('admin.products.wizard.info.markdownHint')}
              </p>
            </>
          ) : (
            <div className="markdown-preview">
              {form.description ? (
                <ReactMarkdown>{form.description}</ReactMarkdown>
              ) : (
                <p className="preview-empty">{t('admin.products.wizard.info.noPreview')}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
