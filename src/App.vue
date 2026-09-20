<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const active = computed({
  get: () => route.name,
  set: (value) => router.push({ name: value })
})
</script>

<template>
  <div class="app-container">
    <router-view />
    <van-tabbar v-model="active" v-if="route.meta.showTabbar">
      <van-tabbar-item name="home" icon="home-o">首页</van-tabbar-item>
      <van-tabbar-item name="import" icon="plus">导入</van-tabbar-item>
      <van-tabbar-item name="stats" icon="chart-trending-o">统计</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #f7f8fa;
  -webkit-font-smoothing: antialiased;
}

.app-container {
  min-height: 100vh;
}
</style>
