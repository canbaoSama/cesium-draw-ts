import { createApp } from 'vue'
import {
    ElButton, ElColorPicker, ElForm, ElFormItem, ElImage, ElInput, ElInputNumber, ElOption, ElScrollbar, ElSelect, ElSwitch,
} from 'element-plus'

import 'element-plus/theme-chalk/index.css'
import 'virtual:uno.css'

import App from './App.vue'

import router from '@/router'

import '@/styles/index.less'
// 构建vue实例
const app = createApp(App)

app.use(router)

app.use(ElButton).use(ElForm).use(ElInput).use(ElImage).use(ElScrollbar).use(ElInputNumber).use(ElSwitch).use(ElColorPicker).use(ElFormItem).use(ElSelect).use(ElOption)

declare global {
    interface Window {
        CESIUM_BASE_URL: string
        Sandcastle: any
    }
}

app.mount('#app')
