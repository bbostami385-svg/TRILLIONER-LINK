export function patchListItem<T extends { id: number }>(items: T[] | undefined, id: number, patch: Partial<T>) {
  return items?.map((item) => item.id === id ? { ...item, ...patch } : item);
}

export function removeListItem<T extends { id: number }>(items: T[] | undefined, id: number) {
  return items?.filter((item) => item.id !== id);
}

export function appendListItem<T>(items: T[] | undefined, item: T) {
  return items ? [...items, item] : [item];
}

export function restoreSnapshot<T>(snapshot: T) {
  return snapshot;
}
