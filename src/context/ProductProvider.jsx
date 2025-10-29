import React, { useState, useEffect } from "react";
import { ProductContext } from "../context/ProductContext";
import { productAPI } from "../api";

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const res = await productAPI.getAll();
      setProducts(res.data?.data || res.data || []);
    } catch (error) {
      console.error("❌ Lỗi tải sản phẩm:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <ProductContext.Provider value={{ products, loading, fetchProducts }}>
      {children}
    </ProductContext.Provider>
  );
};
