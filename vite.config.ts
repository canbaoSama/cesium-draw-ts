// import path, { resolve } from 'node:path'
import { resolve } from 'node:path'

import UnoCSS from 'unocss/vite'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueSetupExtend from 'vite-plugin-vue-setup-extend'
import { viteExternalsPlugin } from 'vite-plugin-externals'
// import { viteStaticCopy } from 'vite-plugin-static-copy'
// import { h, insertHtml } from 'vite-plugin-insert-html'
import vitePluginRequire from 'vite-plugin-require'

export default defineConfig(() => {
    return {
        base: './',
        plugins: [
            vue(),
            // script setup语法糖增强插件 @
            VueSetupExtend(),
            viteExternalsPlugin(
                {
                    // key 是要外部化的依赖名，value 是全局访问的名称，这里填写的是 'Cesium'
                    // 意味着外部化后的 cesium 依赖可以通过 window['Cesium'] 访问；
                    // 支持链式访问，参考此插件的文档
                    cesium: 'Cesium',
                },
                {
                    disableInServe: true, // 开发模式时不外部化
                },
            ),
            // viteStaticCopy({
            //     targets: [
            //         {
            //             src: 'node_modules/cesium/Build/CesiumUnminified/Cesium.js',
            //             dest: 'libs/cesium/',
            //         },
            //         {
            //             src: 'node_modules/cesium/Build/CesiumUnminified/Assets/*',
            //             dest: 'libs/cesium/Assets/',
            //         },
            //         {
            //             src: 'node_modules/cesium/Build/CesiumUnminified/ThirdParty/*',
            //             dest: 'libs/cesium/ThirdParty/',
            //         },
            //         {
            //             src: 'node_modules/cesium/Build/CesiumUnminified/Workers/*',
            //             dest: 'libs/cesium/Workers/',
            //         },
            //         {
            //             src: 'node_modules/cesium/Build/CesiumUnminified/Widgets/*',
            //             dest: 'libs/cesium/Widgets/',
            //         },
            //     ],
            // }),
            vitePluginRequire(),
            // insertHtml({
            //     // 打包时在index.html文件的body中插入文件引用
            //     body: [
            //         h('script', {
            //             src: 'libs/cesium/Cesium.js',
            //         }),
            //     ],
            // }),
            UnoCSS(),
        ],
        resolve: {
            alias: [
                {
                    find: '@',
                    replacement: resolve(__dirname, './src'),
                },
                {
                    find: '@@',
                    replacement: resolve(__dirname, './src/assets'),
                },
            ],
        },
        css: {
            // css预处理器
            preprocessorOptions: {
                less: {
                    charset: false,
                    additionalData: '@import "./src/styles/index.less";',
                },
            },
        },
        server: {
            host: '0.0.0.0',
            port: 8080,
        },
        build: {
            // sourcemap: true,
            // minify: 'terser',
            // terserOptions: {
            //     compress: {
            //         drop_console: true,
            //         drop_debugger: process.env.NODE_ENV === 'prodiction',
            //     },
            // },
            lib: {
                entry: resolve(__dirname, 'src/index.ts'), // 这里是你的库的入口文件
                name: 'drawGraph', // 这里是你的库的名称
                fileName: 'drawGraph', // 这里是生成的库文件的名称
            },
            outDir: 'dist', // 指定输出路径
            emptyOutDir: true, // 每次构建时清除dist目录
            assetsDir: 'assets', // 指定生成静态资源的存放路径
            assetsInlineLimit: 4096, // 图片转 base64 编码的阈值。为防止过多的 http 请求，Vite 会将小于此阈值的图片转为 base64 格式，可根据实际需求进行调整。
            rollupOptions: {
                // 确保外部化处理那些你不想打包进库的依赖
                external: ['vue'], // 将vue视为外部依赖项
                output: {
                    // chunkFileNames: 'js/[name]-[hash].js', // 引入文件名的名称
                    // entryFileNames: 'js/[name]-[hash].js', // 包的入口文件名称
                    // assetFileNames: '[ext]/[name]-[hash].[ext]', // 资源文件像 字体，图片等
                    // manualChunks(id) {
                    //     // 将pinia的全局库实例打包进vendor，避免和页面一起打包造成资源重复引入
                    //     if (id.includes(path.resolve(__dirname, '/src/store/index.ts')))
                    //         return 'vendor'
                    // },
                },
            },
            cacheDir: 'node_modules/.vite', // 开启缓存
            // esbuild: {
            //     drop: ['console', 'debugger'],
            // },
        },
    }
})
