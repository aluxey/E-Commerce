import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContextObject";

export const useTheme = () => useContext(ThemeContext);