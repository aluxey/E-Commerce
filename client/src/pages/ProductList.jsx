import { useEffect, useState } from "react";
import { supabase } from "../supabase/supabaseClient";
import ItemCard from "../components/ItemCard";
import "../styles/Item.css";

export default function ItemList() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetchItems = async () => {
      const { data, error } = await supabase
        .from("items")
        .select(`
          *,
          item_images (
            image_url
          )
        `);

      if (!error) setItems(data);
      else console.error("Erreur lors du chargement des items :", error);
    };

    fetchItems();
  }, []);

  return (
    <div className="grid">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
