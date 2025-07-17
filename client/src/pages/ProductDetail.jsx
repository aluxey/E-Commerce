import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabase/supabaseClient";
import "../styles/Item.css";

export default function ItemDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);

  useEffect(() => {
    const fetchItemWithImages = async () => {
      const { data, error } = await supabase
        .from("items")
        .select(`
          *,
          item_images (
            image_url
          )
        `)
        .eq("id", id)
        .single();

      if (!error) {
        setItem(data);
      } else {
        console.error("Erreur lors du chargement de l'item :", error);
      }
    };

    if (id) fetchItemWithImages();
  }, [id]);

  if (!item) return <p>Chargement...</p>;

  return (
    <div className="item-detail">
      {/* image principale */}
      {item.item_images?.[0]?.image_url && (
        <img src={item.item_images[0].image_url} alt={item.name} />
      )}

      <h1>{item.name}</h1>
      <p>{item.description}</p>
      <p><strong>{item.price} €</strong></p>

      {/* galerie d’images supplémentaires */}
      <div className="image-gallery">
        {item.item_images?.length > 1 ? (
          item.item_images.slice(1).map((img, index) => (
            <img
              key={index}
              src={img.image_url}
              alt={`Image produit ${index + 2}`}
            />
          ))
        ) : (
          <p>Aucune autre image disponible pour ce produit.</p>
        )}
      </div>
    </div>
  );
}
