import { useContext } from "react";
import { CartContext } from "../context/CartContextObject";

export const useCart = () => useContext(CartContext);