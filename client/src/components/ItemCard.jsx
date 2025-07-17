import { Link } from "react-router-dom";
import "../styles/Item.css";

export default function ItemCard({ item }) {
  const imageUrl = item.item_images?.[0]?.image_url;

  return (
    <Link to={`/item/${item.id}`} className="card">
      {imageUrl && <img src={imageUrl} alt={item.name} className="card-img" />}
      <div className="card-body">
        <h2>{item.name}</h2>
        <p>{item.price} €</p>
      </div>
    </Link>
  );
}
