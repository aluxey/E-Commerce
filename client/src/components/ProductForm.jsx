import { useState } from "react";
import { supabase } from "../supabase/supabaseClient";

const ProductForm = () => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState('');

  const uploadImage = async (file, itemId) => {
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `${itemId}/${fileName}`;

    // 1. Upload du fichier
    const { error: uploadError } = await supabase
      .storage
      .from("product-images")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Erreur upload :", uploadError);
      return null;
    }

    // 2. Récupérer l'URL publique
    const { data: publicData } = supabase
      .storage
      .from("product-images")
      .getPublicUrl(filePath);

    const imageUrl = publicData.publicUrl;

    // 3. Enregistrer dans item_images
    const { error: dbError } = await supabase
      .from("item_images")
      .insert([{ item_id: itemId, image_url: imageUrl }]);

    if (dbError) {
      console.error("Erreur DB:", dbError);
      return null;
    }

    return imageUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Création du produit
    const { data, error } = await supabase
      .from('items')
      .insert([{ name, price: parseFloat(price), description }])
      .select()
      .single();

    if (error) {
      setMessage(error.message);
      return;
    }

    const itemId = data.id;

    // Upload des images
    const uploads = Array.from(files).map((file) => uploadImage(file, itemId));
    await Promise.all(uploads);

    setMessage("Produit et images ajoutés !");
    setName('');
    setPrice('');
    setDescription('');
    setFiles([]);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nom"
        className="input"
        required
      />
      <input
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Prix"
        className="input"
        required
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        className="input"
      />
      <input
        type="file"
        multiple
        onChange={(e) => setFiles(e.target.files)}
      />

      <button type="submit" className="btn-primary">Ajouter</button>
      {message && <p>{message}</p>}
    </form>
  );
};

export default ProductForm;
