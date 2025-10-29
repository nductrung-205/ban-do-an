import { useContext } from "react";
import { ProductContext } from "../context/ProductContext";

export const useProducts = () => useContext(ProductContext);
