import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ShoppingCart, Heart } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { addCartItem, getCartCount, getCartTotal, removeCartItem, type CartItem } from "@/lib/marketplaceCart";
import "./Marketplace.css";

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  seller: string;
  inStock: boolean;
}

export default function Marketplace() {
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();
  const transactionsQuery = trpc.payment.getMarketplaceTransactions.useQuery(undefined, { enabled: isAuthenticated });
  const createTransaction = trpc.payment.createMarketplaceTransaction.useMutation();
  const initiatePayment = trpc.payment.initiatePayment.useMutation();
  const [customerName, setCustomerName] = useState(user?.name ?? "");
  const [customerEmail, setCustomerEmail] = useState(user?.email ?? "");
  const [customerPhone, setCustomerPhone] = useState("");
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem<Product>[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const products: Product[] = [
    {
      id: 1,
      name: "Premium Headphones",
      price: 4999,
      image: "🎧",
      seller: "TechStore",
      inStock: true,
    },
    {
      id: 2,
      name: "Wireless Mouse",
      price: 1299,
      image: "🖱️",
      seller: "GadgetHub",
      inStock: true,
    },
    {
      id: 3,
      name: "USB-C Cable",
      price: 399,
      image: "🔌",
      seller: "CableWorld",
      inStock: true,
    },
    {
      id: 4,
      name: "Phone Stand",
      price: 599,
      image: "📱",
      seller: "AccessoriesPlus",
      inStock: false,
    },
    {
      id: 5,
      name: "Laptop Bag",
      price: 2499,
      image: "🎒",
      seller: "BagStore",
      inStock: true,
    },
    {
      id: 6,
      name: "Screen Protector",
      price: 299,
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
    setCart((prev) => addCartItem(prev, product));
    setCartOpen(true);
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => removeCartItem(prev, productId));
  };

  const totalPrice = getCartTotal(cart);
  const cartCount = getCartCount(cart);

  const handleCheckout = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!cart.length) return;
    setCheckoutError(null);
    const orderId = `TL-${user?.id ?? "user"}-${Date.now()}`;
    const productName = cart.map((item) => `${item.product.name} x${item.quantity}`).join(", ");
    try {
      await createTransaction.mutateAsync({ orderId, productName, amountMinor: totalPrice * 100, currency: "BDT" });
      const payment = await initiatePayment.mutateAsync({
        amount: totalPrice,
        productName,
        productDescription: "TRILLIONER LINK Marketplace order",
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        orderId,
        currency: "BDT",
      });
      if (!payment.redirectGatewayURL && !payment.GatewayPageURL) throw new Error("Payment gateway URL was not returned");
      window.location.assign(payment.redirectGatewayURL || payment.GatewayPageURL);
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Unable to start checkout. Please try again.");
    }
  };

  return (
    <div className="marketplace-container">
      {/* Header */}
      <div className="marketplace-header">
        <h1>🛍️ Marketplace</h1>
        <div className="header-actions">
          <button className="cart-btn" onClick={() => setCartOpen((open) => !open)} aria-label="Toggle shopping cart">
            <ShoppingCart size={20} />
            <span className="cart-count">{cartCount}</span>
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

              <p className="text-xs text-slate-500">No ratings yet</p>

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

      <section className="mx-auto mt-8 max-w-5xl rounded-xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm" aria-labelledby="marketplace-transactions-heading">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 id="marketplace-transactions-heading" className="text-lg font-semibold">Your marketplace transactions</h2>
            <p className="text-sm text-slate-500">Payment status is updated only after server-side provider confirmation.</p>
          </div>
          {transactionsQuery.isFetching && <span className="text-xs text-slate-500">Refreshing…</span>}
        </div>
        {transactionsQuery.isError ? (
          <p className="mt-4 text-sm text-red-600">Transaction history is temporarily unavailable.</p>
        ) : transactionsQuery.data?.length ? (
          <div className="mt-4 space-y-2">
            {transactionsQuery.data.map((transaction) => (
              <div key={transaction.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <span><strong>{transaction.productName}</strong> · {transaction.orderId}</span>
                <span className="rounded-full bg-slate-200 px-2 py-1 text-xs uppercase">{transaction.status}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">No marketplace transactions yet.</p>
        )}
      </section>

      {/* Cart Sidebar */}
      {cartOpen && cart.length > 0 && (
        <div className="cart-sidebar">
          <div className="cart-header">
            <h3>Cart ({cart.length})</h3>
            <button className="close-cart" onClick={() => setCartOpen(false)} aria-label="Close shopping cart">✕</button>
          </div>

          <div className="cart-items">
            {cart.map((item) => (
              <div key={item.id} className="cart-item">
                <span>{item.product.name} × {item.quantity}</span>
                <div className="flex items-center gap-2">
                  <span>₹{(item.price * item.quantity).toLocaleString()}</span>
                  <button type="button" onClick={() => removeFromCart(item.id)} aria-label={`Remove one ${item.product.name}`}>−</button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-total">
            <p>Total: ₹{totalPrice.toLocaleString()}</p>
          </div>

          <form className="mt-4 space-y-2" onSubmit={handleCheckout}>
            <label className="sr-only" htmlFor="marketplace-customer-name">Full name</label>
            <input id="marketplace-customer-name" required value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Full name" className="w-full rounded border px-3 py-2" />
            <label className="sr-only" htmlFor="marketplace-customer-email">Email</label>
            <input id="marketplace-customer-email" required type="email" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} placeholder="Email" className="w-full rounded border px-3 py-2" />
            <label className="sr-only" htmlFor="marketplace-customer-phone">Phone</label>
            <input id="marketplace-customer-phone" required value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} placeholder="Phone" className="w-full rounded border px-3 py-2" />
            {checkoutError && <p className="text-sm text-red-600" role="alert">{checkoutError}</p>}
            <button className="checkout-btn" type="submit" disabled={createTransaction.isPending || initiatePayment.isPending}>
              {createTransaction.isPending || initiatePayment.isPending ? "Starting secure checkout…" : "Proceed to secure checkout"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
