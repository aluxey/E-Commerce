import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from './ui';
import { Send, Paperclip, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import '../styles/contact-modal.css';

const getApiUrl = () => {
  const rawApiUrl =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_URL_PROD ||
    import.meta.env.VITE_API_URL_LOCAL ||
    'http://localhost:3000';
  return rawApiUrl
    .replace(/\/api\/health\/?$/i, '')
    .replace(/\/$/, '');
};

export default function ContactModal({ isOpen, onClose }) {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [attachment, setAttachment] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState('');

  const subjectOptions = [
    { value: '', label: t('contact.subjectPlaceholder') },
    { value: 'custom-order', label: t('contact.subjects.customOrder') },
    { value: 'question', label: t('contact.subjects.question') },
    { value: 'order-issue', label: t('contact.subjects.orderIssue') },
    { value: 'collaboration', label: t('contact.subjects.collaboration') },
    { value: 'other', label: t('contact.subjects.other') },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage(t('contact.errors.fileTooLarge'));
        return;
      }
      setAttachment(file);
      setErrorMessage('');
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', subject: '', message: '' });
    setAttachment(null);
    setStatus('idle');
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    if (status !== 'loading') {
      resetForm();
      onClose();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const formPayload = new FormData();
      formPayload.append('name', formData.name);
      formPayload.append('email', formData.email);
      formPayload.append('subject', formData.subject);
      formPayload.append('message', formData.message);
      
      if (attachment) {
        formPayload.append('attachment', attachment);
      }

      const response = await fetch(`${getApiUrl()}/api/contact`, {
        method: 'POST',
        body: formPayload,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('contact.errors.generic'));
      }

      setStatus('success');
      
      // Auto close after success
      setTimeout(() => {
        handleClose();
      }, 2500);
    } catch (err) {
      setStatus('error');
      setErrorMessage(err.message || t('contact.errors.generic'));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('contact.title')}
      description={t('contact.description')}
      size="md"
      closable={status !== 'loading'}
    >
      {status === 'success' ? (
        <div className="contact-success">
          <CheckCircle size={48} className="contact-success__icon" />
          <h3>{t('contact.success.title')}</h3>
          <p>{t('contact.success.message')}</p>
        </div>
      ) : (
        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="contact-form__row">
            <div className="contact-form__field">
              <label htmlFor="contact-name">{t('contact.fields.name')}</label>
              <input
                id="contact-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={t('contact.placeholders.name')}
                required
                disabled={status === 'loading'}
              />
            </div>
            <div className="contact-form__field">
              <label htmlFor="contact-email">{t('contact.fields.email')}</label>
              <input
                id="contact-email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={t('contact.placeholders.email')}
                required
                disabled={status === 'loading'}
              />
            </div>
          </div>

          <div className="contact-form__field">
            <label htmlFor="contact-subject">{t('contact.fields.subject')}</label>
            <select
              id="contact-subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              disabled={status === 'loading'}
            >
              {subjectOptions.map(opt => (
                <option key={opt.value} value={opt.value} disabled={!opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="contact-form__field">
            <label htmlFor="contact-message">{t('contact.fields.message')}</label>
            <textarea
              id="contact-message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder={t('contact.placeholders.message')}
              rows={5}
              required
              disabled={status === 'loading'}
            />
          </div>

          <div className="contact-form__field">
            <label>{t('contact.fields.attachment')}</label>
            <div className="contact-form__attachment">
              {attachment ? (
                <div className="contact-form__file-preview">
                  <Paperclip size={16} />
                  <span className="contact-form__file-name">{attachment.name}</span>
                  <span className="contact-form__file-size">
                    ({t('contact.fileSizeKb', { size: (attachment.size / 1024).toFixed(1) })})
                  </span>
                  <button
                    type="button"
                    className="contact-form__file-remove"
                    onClick={removeAttachment}
                    disabled={status === 'loading'}
                    aria-label={t('contact.removeFile')}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="contact-form__file-input">
                  <Paperclip size={18} />
                  <span>{t('contact.addFile')}</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*,.pdf,.doc,.docx"
                    disabled={status === 'loading'}
                  />
                </label>
              )}
              <p className="contact-form__file-hint">{t('contact.fileHint')}</p>
            </div>
          </div>

          {status === 'error' && errorMessage && (
            <div className="contact-form__error">
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="contact-form__actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleClose}
              disabled={status === 'loading'}
            >
              {t('contact.cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {t('contact.sending')}
                </>
              ) : (
                <>
                  <Send size={18} />
                  {t('contact.send')}
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
