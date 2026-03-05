import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../context/CartContextObject';
import { pushToast } from '../utils/toast';
import { useTranslation } from 'react-i18next';

export default function MiniItemCard({ item }) {
  const { addItem, cart } = useContext(CartContext);
  const imageUrl = item?.item_images?.[0]?.image_url;
  const variants = item?.item_variants || [];
  const preferredVariant = variants.find(v => (v.stock ?? 0) > 0) || variants[0] || null;
  const displayPrice = item?.price != null ? Number(item.price) : preferredVariant?.price != null ? Number(preferredVariant.price) : 0;
  const { t } = useTranslation();

  const handleAdd = e => {
    e.preventDefault();
    if (!preferredVariant) {
      pushToast({
        message: t('cart.toast.unavailable'),
        variant: 'warning',
      });
      return;
    }

    const stock = preferredVariant.stock ?? null;
    const existingQty = cart.find(line => line.variantId === preferredVariant.id)?.quantity || 0;
    if (stock != null && existingQty >= stock) {
      pushToast({
        message: t('cart.toast.stockLimit', { name: item.name, stock }),
        variant: 'warning',
      });
      return;
    }

    addItem({ item, variant: preferredVariant });
    pushToast({
      message: t('cart.toast.added', { name: item.name }),
      variant: 'success',
    });
  };

  return (
    <div className="mini-card">
      <div className="mini-card__image">
        {imageUrl ? (
          <img src={imageUrl} alt={item?.name || 'Produit'} />
        ) : (
          <div className="mini-card__placeholder">{t('miniCard.imageUnavailable')}</div>
        )}
      </div>
      <div className="mini-card__body">
        <div className="mini-card__info">
          <h3 className="mini-card__title" title={item?.name}>{item?.name}</h3>
          <div className="mini-card__price">{displayPrice.toFixed(2)} €</div>
        </div>
        <div className="mini-card__actions">
          <Link to={`/item/${item?.id}`} className="btn btn-ghost" aria-label={t('miniCard.detailsAria')}>
            {t('miniCard.details')}
          </Link>
          <button
            className="btn btn-primary"
            onClick={handleAdd}
            aria-label={t('miniCard.addAria')}
            disabled={!preferredVariant || (preferredVariant.stock != null && preferredVariant.stock <= 0)}
          >
            {t('miniCard.add')}
          </button>
        </div>
      </div>
    </div>
  );
}
