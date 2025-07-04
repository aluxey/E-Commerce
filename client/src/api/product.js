import axios from 'axios';

const API_URL = 'http://localhost:3001/items';

export const fetchProducts = async () => {
  const response = await axios.get(API_URL);
  console.log('Appel API vers :', API_URL);
  return response.data;
};
