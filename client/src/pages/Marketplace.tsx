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
  imageUrl: string | null;
  seller: string;
  inStock: boolean;
  stock: number;
  currency: string;
  category: string;
}

export default function Marketplace() {
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const transactionsQuery = trpc.payment.getMarketplaceTransactions.useQuery(undefined, { enabled: isAuthenticated });
  const productsQuery = trpc.marketplace.listProducts.useQuery({ category: selectedCategory, limit: 48 }, { enabled: isAuthenticated });
  const allListingsQuery = trpc.marketplace.listProducts.useQuery({ category: "all", limit: 100 }, { enabled: isAuthenticated });
  const myProductsQuery = trpc.marketplace.listMyProducts.useQuery({ limit: 100 }, { enabled: isAuthenticated });
  const createProduct = trpc.marketplace.createProduct.useMutation();
  const updateProduct = trpc.marketplace.updateProduct.useMutation();
  const archiveProduct = trpc.marketplace.archiveProduct.useMutation();
  const createTransaction = trpc.payment.createMarketplaceTransaction.useMutation();
  const initiatePayment = trpc.payment.initiatePayment.useMutation();
  const [customerName, setCustomerName] = useState(user?.name ?? "");
  const [customerEmail, setCustomerEmail] = useState(user?.email ?? "");
  const [customerPhone, setCustomerPhone] = useState("");
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem<Product>[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [sellerForm, setSellerForm] = useState({ name: "", category: "", description: "", price: "", stock: "", imageUrl: "" });
  const [editingProductId, setEditingProductId] = useState<number | null>(null);

  const products: Product[] = (productsQuery.data ?? []).map((product) => ({
    id: product.id,
    name: product.name,
    price: product.priceMinor / 100,
    image: "🛍️",
    imageUrl: product.imageUrl,
    seller: product.sellerName ?? "TRILLIONER LINK seller",
    inStock: product.stock > 0,
    stock: product.stock,
    currency: product.currency,
    category: product.category,
  }));

  const categoryValues = Array.from(new Set((allListingsQuery.data ?? []).map((product) => product.category))).sort();
  const categories = [
    { id: "all", name: "All Products", icon: "🛍️" },
    ...categoryValues.map((category) => ({ id: category, name: category, icon: "•" })),
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
  const formatProductPrice = (product: Product) => new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: product.currency || "BDT",
    maximumFractionDigits: 2,
  }).format(product.price);

  const handleCreateProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const price = Number(sellerForm.price);
    const stock = Number(sellerForm.stock);
    if (!sellerForm.name.trim() || !sellerForm.category.trim() || !Number.isFinite(price) || price <= 0 || !Number.isInteger(stock) || stock < 0) return;
    const input = { name: sellerForm.name.trim(), category: sellerForm.category.trim(), description: sellerForm.description.trim() || undefined, priceMinor: Math.round(price * 100), stock, currency: "BDT" as const, imageUrl: sellerForm.imageUrl.trim() || undefined };
    if (editingProductId) await updateProduct.mutateAsync({ id: editingProductId, ...input });
    else await createProduct.mutateAsync(input);
    setSellerForm({ name: "", category: "", description: "", price: "", stock: "", imageUrl: "" });
    setEditingProductId(null);
    await Promise.all([myProductsQuery.refetch(), allListingsQuery.refetch(), productsQuery.refetch()]);
  };

  const handleCheckout = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!cart.length) return;
    setCheckoutError(null);
    const orderId = `TL-${user?.id ?? "user"}-${Date.now()}`;
    const productName = cart.map((item) => `${item.product.name} x${item.quantity}`).join(", ");
    try {
      await createTransaction.mutateAsync({
        orderId,
        productName,
        amountMinor: Math.round(totalPrice * 100),
        currency: "BDT",
        items: cart.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
      });
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
      <div className="products-grid" aria-live="polite">
        {productsQuery.isLoading ? (
          Array.from({ length: 6 }).map((_, index) => <div key={index} className="product-card animate-pulse"><div className="product-image bg-slate-200" /><div className="product-info space-y-3"><div className="h-5 rounded bg-slate-200" /><div className="h-4 w-2/3 rounded bg-slate-200" /><div className="h-9 rounded bg-slate-200" /></div></div>)
        ) : productsQuery.isError ? (
          <div className="col-span-full rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-700">Marketplace listings are temporarily unavailable. Please try again.</div>
        ) : products.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">No active listings in this category yet.</div>
        ) : products.map((product) => (
          <div key={product.id} className="product-card">
            <div className="product-image">{product.imageUrl ? <img src={product.imageUrl} alt={product.name} loading="lazy" className="h-full w-full object-cover" /> : product.image}</div>

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
                <p className="price">{formatProductPrice(product)}</p>
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

      <section className="mx-auto mt-8 max-w-5xl rounded-xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm" aria-labelledby="seller-listings-heading">
        <div className="mb-4"><h2 id="seller-listings-heading" className="text-lg font-semibold">Sell on TRILLIONER LINK</h2><p className="text-sm text-slate-500">Create a listing with a real price, inventory, and optional product image.</p></div>
        <form onSubmit={handleCreateProduct} className="grid gap-3 md:grid-cols-2">
          <input required value={sellerForm.name} onChange={(event) => setSellerForm({ ...sellerForm, name: event.target.value })} placeholder="Product name" className="rounded border px-3 py-2" />
          <input required value={sellerForm.category} onChange={(event) => setSellerForm({ ...sellerForm, category: event.target.value })} placeholder="Category" className="rounded border px-3 py-2" />
          <input required type="number" min="0.01" step="0.01" value={sellerForm.price} onChange={(event) => setSellerForm({ ...sellerForm, price: event.target.value })} placeholder="Price in BDT" className="rounded border px-3 py-2" />
          <input required type="number" min="0" step="1" value={sellerForm.stock} onChange={(event) => setSellerForm({ ...sellerForm, stock: event.target.value })} placeholder="Stock quantity" className="rounded border px-3 py-2" />
          <input type="url" value={sellerForm.imageUrl} onChange={(event) => setSellerForm({ ...sellerForm, imageUrl: event.target.value })} placeholder="Product image URL (optional)" className="rounded border px-3 py-2 md:col-span-2" />
          <textarea value={sellerForm.description} onChange={(event) => setSellerForm({ ...sellerForm, description: event.target.value })} placeholder="Description (optional)" className="rounded border px-3 py-2 md:col-span-2" rows={2} />
          <div className="flex gap-2 md:col-span-2"><button type="submit" disabled={createProduct.isPending || updateProduct.isPending} className="rounded bg-slate-900 px-4 py-2 font-medium text-white disabled:opacity-60">{createProduct.isPending || updateProduct.isPending ? "Saving…" : editingProductId ? "Save changes" : "Publish listing"}</button>{editingProductId && <button type="button" className="rounded border px-4 py-2" onClick={() => { setEditingProductId(null); setSellerForm({ name: "", category: "", description: "", price: "", stock: "", imageUrl: "" }); }}>Cancel</button>}</div>
        </form>
        {myProductsQuery.data?.length ? <div className="mt-5 space-y-2">{myProductsQuery.data.map((product) => <div key={product.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm"><span><strong>{product.name}</strong> · {product.stock} in stock · {product.status}</span><div className="flex gap-3">{product.status === "active" && <button type="button" className="text-slate-700" onClick={() => { setEditingProductId(product.id); setSellerForm({ name: product.name, category: product.category, description: product.description ?? "", price: (product.priceMinor / 100).toString(), stock: product.stock.toString(), imageUrl: product.imageUrl ?? "" }); }}>Edit</button>}{product.status === "active" && <button type="button" className="text-red-600" disabled={archiveProduct.isPending} onClick={async () => { await archiveProduct.mutateAsync({ id: product.id }); await Promise.all([myProductsQuery.refetch(), allListingsQuery.refetch(), productsQuery.refetch()]); }}>Archive</button>}</div></div>)}</div> : <p className="mt-4 text-sm text-slate-500">You have not published a listing yet.</p>}
      </section>

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
