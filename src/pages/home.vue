<script setup lang="ts">
import { Camera, Ion, Rectangle, UrlTemplateImageryProvider, Viewer, createWorldTerrainAsync } from 'cesium'

import type { Ref } from 'vue'
import { onMounted, ref } from 'vue'

import 'cesium/Build/CesiumUnminified/Widgets/widgets.css'
import '@/assets/Sandcastle-header'

import { CESIUM_CONFIG, billyangAccessToken } from '@/config'
import DrawModel from '@/components/DrawModel.vue'

window.CESIUM_BASE_URL = CESIUM_CONFIG.CESIUM_BASE_URL

const viewer: Ref<Viewer | undefined> = ref()
const show = ref(false)
async function createViewer() {
    try {
        Camera.DEFAULT_VIEW_RECTANGLE = Rectangle.fromDegrees(...CESIUM_CONFIG.DEFAULT_VIEW_RECTANGLE)// 默认定位到中国上空，home定位到中国范围
        Camera.DEFAULT_VIEW_FACTOR = CESIUM_CONFIG.DEFAULT_VIEW_FACTOR
        // 个人的access token,有时候默认的加载会出问题,就换成这个
        Ion.defaultAccessToken = billyangAccessToken
        viewer.value = new Viewer('viewerContainer', {
            // 隐藏底部控件
            animation: false,
            timeline: false,
            fullscreenButton: false,
            navigationHelpButton: false,
            sceneModePicker: false,
            infoBox: false, // 点击时的提示
            baseLayerPicker: false,
            shouldAnimate: true,
        })

        const terrainProvider = await createWorldTerrainAsync({ requestWaterMask: true, requestVertexNormals: true })
        viewer.value.terrainProvider = terrainProvider
        viewer.value.scene.globe.depthTestAgainstTerrain = true // 地形遮挡
        show.value = true
    }
    catch (err) {
        console.warn(err)
    }
}
function addDefaultImageryProvider() {
    const imgLayer = new UrlTemplateImageryProvider({
        url: CESIUM_CONFIG.IMG_PROVIDER_DEFAULT,
        maximumLevel: 14,
    })
    viewer.value?.imageryLayers.addImageryProvider(imgLayer)
}
const drawRef = ref()
function showData() {
    console.warn(drawRef.value.drawStore)
}

onMounted(async () => {
    await createViewer()
    // 地球贴图
    addDefaultImageryProvider()
})
</script>

<template>
    <div class="wh-full relative">
        <ElButton type="primary" size="large" class="absolute z-100 top-10 left-10" @click="showData">
            点击查看数据
        </ElButton>
        <div id="viewerContainer" class="fixed wh-full overflow-hidden" />
        <DrawModel v-if="show" ref="drawRef" :viewer="viewer" class="absolute right-0 top-10" />
    </div>
</template>

<style lang="less">
// 双球隐藏控件
.cesium-viewer-bottom {
    display: none;
}
</style>
