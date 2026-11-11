<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue';
import { useThemeStore } from './store/theme';

const themeStore = useThemeStore();
onMounted(() => themeStore.apply());
</script>
