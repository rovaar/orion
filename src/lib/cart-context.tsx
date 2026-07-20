"use client";

// Estado global del carrito (solo cliente) con un "store" externo a nivel de
// módulo + useSyncExternalStore.
//
// ¿Por qué así y no Context + useEffect?
//   - Es el patrón que React 19 recomienda para leer de un almacén externo
//     (aquí localStorage) SIN errores de hidratación: en el servidor devuelve
//     un snapshot vacío y, tras hidratar, React re-renderiza con el valor real.
//   - Al ser un singleton de módulo, no hace falta envolver la app en un
//     <Provider>: cualquier componente puede usar useCart().

import { useSyncExternalStore } from "react";

export interface CartItem {
  variantId: string;
  productSlug: string;
  productTitle: string;
  variantName: string;
  price: string; // "49.90"
  currency: string;
  image: string | null;
  quantity: number;
  maxStock: number;
}

const STORAGE_KEY = "orion.cart.v1";

// --- Store ---
let items: CartItem[] = [];
const listeners = new Set<() => void>();
const emptyServerSnapshot: CartItem[] = []; // referencia estable para SSR

function readStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return []; // JSON corrupto: carrito vacío
  }
}

// Inicializamos desde localStorage al cargar el módulo en el navegador.
if (typeof window !== "undefined") {
  items = readStorage();
}

function emit() {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// getSnapshot devuelve la MISMA referencia mientras no cambie nada (requisito
// de useSyncExternalStore). Cada mutación crea un array nuevo -> re-render.
function getSnapshot(): CartItem[] {
  return items;
}

function getServerSnapshot(): CartItem[] {
  return emptyServerSnapshot;
}

// --- Mutadores ---
function addItem(item: Omit<CartItem, "quantity">, quantity = 1) {
  const existing = items.find((i) => i.variantId === item.variantId);
  if (existing) {
    const newQty = Math.min(existing.quantity + quantity, item.maxStock);
    items = items.map((i) =>
      i.variantId === item.variantId ? { ...i, quantity: newQty } : i,
    );
  } else {
    items = [...items, { ...item, quantity: Math.min(quantity, item.maxStock) }];
  }
  emit();
}

function updateQuantity(variantId: string, quantity: number) {
  items = items.map((i) =>
    i.variantId === variantId
      ? { ...i, quantity: Math.min(Math.max(1, quantity), i.maxStock) }
      : i,
  );
  emit();
}

function removeItem(variantId: string) {
  items = items.filter((i) => i.variantId !== variantId);
  emit();
}

function clear() {
  items = [];
  emit();
}

// --- Hook público ---
export function useCart() {
  const current = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const count = current.reduce((n, i) => n + i.quantity, 0);
  const subtotal = current.reduce(
    (s, i) => s + Number(i.price) * i.quantity,
    0,
  );
  return { items: current, count, subtotal, addItem, updateQuantity, removeItem, clear };
}
