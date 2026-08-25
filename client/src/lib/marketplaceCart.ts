export interface CartProduct {
  id: number;
  price: number;
}

export interface CartItem<T extends CartProduct = CartProduct> extends CartProduct {
  product: T;
  quantity: number;
}

export function addCartItem<T extends CartProduct>(cart: CartItem<T>[], product: T): CartItem<T>[] {
  const existing = cart.find((item) => item.id === product.id);
  if (existing) {
    return cart.map((item) =>
      item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
    );
  }
  return [...cart, { id: product.id, price: product.price, product, quantity: 1 }];
}

export function removeCartItem<T extends CartProduct>(cart: CartItem<T>[], productId: number): CartItem<T>[] {
  return cart.flatMap((item) => {
    if (item.id !== productId) return [item];
    if (item.quantity > 1) return [{ ...item, quantity: item.quantity - 1 }];
    return [];
  });
}

export function getCartTotal<T extends CartProduct>(cart: CartItem<T>[]): number {
  return cart.reduce((total, item) => total + item.price * item.quantity, 0);
}

export function getCartCount<T extends CartProduct>(cart: CartItem<T>[]): number {
  return cart.reduce((total, item) => total + item.quantity, 0);
}
