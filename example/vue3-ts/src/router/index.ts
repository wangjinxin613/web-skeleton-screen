import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
   {
    path: '/home',
    name: 'home',
    component: () => import(/* webpackChunkName: "Home" */ '../views/home/index.vue')
   },
  
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})


router.beforeEach((to, from, next) => {
  /* 路由发生变化修改页面title */
  if (to.name) document.title = to.name.toString();
  next();
})

export default router
