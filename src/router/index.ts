import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHashHistory } from 'vue-router'

export const routes: Array<RouteRecordRaw> = [
    {
        path: '/',
        redirect: '/home',
    },
    {
        path: '/home',
        name: 'home',
        component: () => import('@/pages/home.vue'),
        meta: {
            navigation: '首页',
            unlogin: true,
        },
    },
]

const router = createRouter({
    history: createWebHashHistory(),
    routes,
})

export default router
