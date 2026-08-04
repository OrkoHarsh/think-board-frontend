export const STORAGE_KEYS = {
  TOKEN: 'nimbus_token',
  REFRESH_TOKEN: 'nimbus_refresh_token',
  USER: 'nimbus_user',
};

export const storage = {
  getToken: () => localStorage.getItem(STORAGE_KEYS.TOKEN),
  setToken: (token) => localStorage.setItem(STORAGE_KEYS.TOKEN, token),
  removeToken: () => localStorage.removeItem(STORAGE_KEYS.TOKEN),

  getRefreshToken: () => localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
  setRefreshToken: (token) => localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token),
  removeRefreshToken: () => localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),

  getUser: () => {
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
  },
  setUser: (user) => localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)),
  removeUser: () => localStorage.removeItem(STORAGE_KEYS.USER),

  clear: () => localStorage.clear(),
};
