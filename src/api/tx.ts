/**
 * Transaction numbers for POST /toProccess.
 * They come from the backend's deterministic BO registration (BO dirs sorted, txStart 1000),
 * so they only change if the backend adds, removes or reorders BO methods.
 */
export const TX = {
  category: { get: 1009, getAll: 1010, create: 1011, update: 1012, delete: 1013 },
  component: { get: 1014, getAll: 1015, create: 1016, update: 1017, delete: 1018 },
  inventory: {
    get: 1033,
    getAll: 1034,
    create: 1035,
    update: 1036,
    delete: 1037,
    addStock: 1038,
    removeStock: 1039,
    moveLocation: 1040,
  },
  location: { getAll: 1054, create: 1055, update: 1056, delete: 1057, get: 1058 },
} as const;
