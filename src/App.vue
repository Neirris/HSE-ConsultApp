<template>
  <v-app>
    <n-message-provider>
      <NavBar v-if="shouldShowNavBar" />
      <SideBar v-if="shouldShowSideBar" />
      <router-view />
    </n-message-provider>
  </v-app>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { NMessageProvider } from 'naive-ui'
import NavBar from './components/utilities/NavBar.vue'
import SideBar from './components/utilities/SideBar.vue'

const route = useRoute()

const shouldShowNavBar = computed(() => {
  return route.path !== '/' && route.path !== '/auth'
})

const shouldShowSideBar = computed(() => {
  return route.path !== '/' && route.path !== '/auth'
})
</script>

<style>
@import 'vue-multiselect/dist/vue-multiselect.css';
</style>