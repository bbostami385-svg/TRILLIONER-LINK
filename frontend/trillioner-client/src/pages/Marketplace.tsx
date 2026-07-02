import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ShoppingCart, Heart, Star } from "lucide-react";
import "./Marketplace.css";

interface Product {
  id: number;
  name: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  seller: string;
  inStock: boolean;
}

export default function Marketplace() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [cart, setCart] = useState<Product[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const products: Product[] = [
    {
      id: 1,
      name: "Premium Headphones",
      price: 4999,
      rating: 4.5,
      reviews: 234,
      image: "🎧",
      seller: "TechStore",
      inStock: true,
    },
    {
      id: 2,
      name: "Wireless Mouse",
      price: 1299,
      rating: 4.2,
      reviews: 156,
      image: "🖱️",
      seller: "GadgetHub",
      inStock: true,
    },
    {
      id: 3,
      name: "USB-C Cable",
      price: 399,
      rating: 4.7,
      reviews: 512,
      image: "🔌",
      seller: "CableWorld",
      inStock: true,
    },
    {
      id: 4,
      name: "Phone Stand",
      price: 599,
      rating: 4.3,
      reviews: 89,
      image: "📱",
      seller: "AccessoriesPlus",
      inStock: false,
    },
    {
      id: 5,
      name: "Laptop Bag",
      price: 2499,
      rating: 4.6,
      reviews: 203,
      image: "🎒",
      seller: "BagStore",
      inStock: true,
    },
    {
      id: 6,
      name: "Screen Protector",
      price: 299,
      rating: 4.4,
      reviews: 678,
      image: "📺",
      seller: "ProtectionCo",
      inStock: true,
    },
  ];

  const categories = [
    { id: "all", name: "All Products", icon: "🛍️" },
    { id: "electronics", name: "Electronics", icon: "⚡" },
    { id: "accessories", name: "Accessories", icon: "🎒" },
    { id: "fashion", name: "Fashion", icon: "👕" },
    { id: "home", name: "Home", icon: "🏠" },
  ];

  if (!isAuthenticated) {
    return (
      <div className="marketplace-container">
        <div className="loading">
          <p>Please log in to shop</p>
          <Button onClick={() => setLocation("/signup")} className="mt-4">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const toggleFavorite = (productId: number) => {
    setFavorites((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const addToCart = (product: Product) => {
    setCart((prev) => [...prev, product]);
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="marketplace-container">
      {/* Header */}
      <div className="marketplace-header">
        <h1>🛍️ Marketplace</h1>
        <div className="header-actions">
          <button className="cart-btn">
            <ShoppingCart size={20} />
            <span className="cart-count">{cart.length}</span>
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="categories-section">
        <div className="categories-scroll">
          {categories.map((category) => (
            <button
              key={category.id}
              className={`category-btn ${
                selectedCategory === category.id ? "active" : ""
              }`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <span className="category-icon">{category.icon}</span>
              <span>{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="products-grid">
        {products.map((product) => (
          <div key={product.id} className="product-card">
            <div className="product-image">{product.image}</div>

            <button
              className={`favorite-btn ${
                favorites.includes(product.id) ? "favorited" : ""
              }`}
              onClick={() => toggleFavorite(product.id)}
            >
              <Heart
                size={18}
                fill={favorites.includes(product.id) ? "currentColor" : "none"}
              />
            </button>

            <div className="product-info">
              <h3>{product.name}</h3>
              <p className="seller-name">{product.seller}</p>

              <div className="rating">
                <Star size={14} fill="#ffd93d" color="#ffd93d" />
                <span>{product.rating}</span>
                <span className="reviews">({product.reviews})</span>
              </div>

              <div className="price-section">
                <p className="price">₹{product.price.toLocaleString()}</p>
                <span className={`stock ${product.inStock ? "in-stock" : "out"}`}>
                  {product.inStock ? "In Stock" : "Out of Stock"}
                </span>
              </div>

              <button
                className="add-to-cart-btn"
                onClick={() => addToCart(product)}
                disabled={!product.inStock}
              >
                {product.inStock ? "Add to Cart" : "Out of Stock"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Cart Sidebar */}
      {cart.length > 0 && (
        <div className="cart-sidebar">
          <div className="cart-header">
            <h3>Cart ({cart.length})</h3>
            <button className="close-cart">✕</button>
          </div>

          <div className="cart-items">
            {cart.map((item, index) => (
              <div key={index} className="cart-item">
                <span>{item.name}</span>
                <span>₹{item.price}</span>
              </div>
            ))}
          </div>

          <div className="cart-total">
            <p>Total: ₹{totalPrice.toLocaleString()}</p>
          </div>

          <button className="checkout-btn">
            Proceed to Checkout
          </button>
        </div>
      )}
    </div>
  );
}
