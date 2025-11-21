// src/utils/pdfBufferStore.js
// function-only singleton Map for storing ArrayBuffers across the app

let _store = null;

function getStore() {
  if (!_store) _store = new Map();
  return _store;
}

export const pdfBufferStore = {
  set(id, buffer) {
    if (!id) return;
    const s = getStore();
    s.set(id, buffer);
  },
  get(id) {
    const s = getStore();
    return s.get(id);
  },
  has(id) {
    return getStore().has(id);
  },
  delete(id) {
    getStore().delete(id);
  },
  keys() {
    return Array.from(getStore().keys());
  },
};
