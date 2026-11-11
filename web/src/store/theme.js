import { defineStore } from 'pinia';

export const THEMES = [
  { key: 'tech', label: '科技风' },
  { key: 'finance', label: '简易风' },
  { key: 'luxury', label: '奢华风' },
];

export const useThemeStore = defineStore('theme', {
  state: () => ({
    current: localStorage.getItem('theme') || 'finance',
  }),
  actions: {
    apply() {
      const root = document.documentElement;
      root.classList.remove('theme-tech', 'theme-luxury');
      if (this.current === 'tech') root.classList.add('theme-tech');
      else if (this.current === 'luxury') root.classList.add('theme-luxury');
    },
    set(key) {
      this.current = key;
      localStorage.setItem('theme', key);
      this.apply();
    },
  },
});
