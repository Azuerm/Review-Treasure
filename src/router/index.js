import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/Home.vue'),
    meta: { showTabbar: true }
  },
  {
    path: '/import',
    name: 'import',
    component: () => import('../views/Import.vue'),
    meta: { showTabbar: true }
  },
  {
    path: '/import/:libraryId',
    name: 'importToLibrary',
    component: () => import('../views/Import.vue')
  },
  {
    path: '/review/:libraryId',
    name: 'review',
    component: () => import('../views/Review.vue')
  },
  {
    path: '/review-all',
    name: 'reviewAll',
    component: () => import('../views/Review.vue'),
    props: { reviewAll: true }
  },
  {
    path: '/wrong-book/:libraryId',
    name: 'wrongBook',
    component: () => import('../views/WrongBook.vue')
  },
  {
    path: '/wrong-book-all',
    name: 'wrongBookAll',
    component: () => import('../views/WrongBook.vue'),
    props: { allMode: true }
  },
  {
    path: '/favorites/:libraryId',
    name: 'favorites',
    component: () => import('../views/Favorites.vue')
  },
  {
    path: '/favorites-all',
    name: 'favoritesAll',
    component: () => import('../views/Favorites.vue'),
    props: { allMode: true }
  },
  {
    path: '/search/:libraryId',
    name: 'search',
    component: () => import('../views/Search.vue')
  },
  {
    path: '/edit/:libraryId/:cardId',
    name: 'editCard',
    component: () => import('../views/EditCard.vue')
  },
  {
    path: '/calendar',
    name: 'calendar',
    component: () => import('../views/Calendar.vue')
  },
  {
    path: '/stats',
    name: 'stats',
    component: () => import('../views/Stats.vue'),
    meta: { showTabbar: true }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
