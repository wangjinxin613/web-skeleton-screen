import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/home'
   },
   {
    path: '/home',
    name: 'home',
    component: () => import(/* webpackChunkName: "Home" */ '../views/home/index.vue'),
   },
   {
    path: '/test/test',
    name: 'test',
    component: () => import(/* webpackChunkName: "Home" */ '../views/test/test.vue')
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
