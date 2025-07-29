import { useEffect, useState } from "react";
import { supabase } from "../supabase/supabaseClient";
import ItemCard from "../components/ItemCard";
import { useCart } from "../context/CartContext";
import "../styles/Item.css";

export default function ItemList() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [categories, setCategories] = useState([]);
  const { addItem } = useCart();

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from("categories").select();
      setCategories(data || []);
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchItems = async () => {
      let query = supabase
        .from("items")
        .select(`
          *,
          item_images (
            image_url
          )
        `);
      if (search) {
        query = query.ilike("name", `%${search}%`);
      }
      if (category !== "all") {
        query = query.eq("category_id", category);
      }

      const { data, error } = await query;
      if (!error) setItems(data);
      else console.error("Erreur lors du chargement des items :", error);
    };

    fetchItems();
  }, [search, category]);

  return (
    <>
      <div className="filters">
        <input
          type="text"
          placeholder="Rechercher"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">Toutes les catégories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} onAddToCart={addItem} />
        ))}
      </div>
    </>
  );
}
