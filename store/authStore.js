import { create } from "zustand";
import { getCurrentUser } from "../services/authService";

const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,

  setUser: (user) =>
    set({
      user,
      loading: false,
    }),

  clearUser: () =>
    set({
      user: null,
      loading: false,
    }),

  setLoading: (loading) =>
    set({
      loading,
    }),

  fetchCurrentUser: async () => {
    if (typeof window !== "undefined" && !localStorage.getItem("chat_token")) {
      set({ user: null, loading: false });
      return null;
    }

    try {
      if (!get().user) {
        set({ loading: true });
      }
      const data = await getCurrentUser();
      if (!data) {
        set({ user: null, loading: false });
        return null;
      }
      const user = data.user || data;
      set({ user, loading: false });
      return user;
    } catch (err) {
      set({ user: null, loading: false });
      return null;
    }
  },
}));

export default useAuthStore;