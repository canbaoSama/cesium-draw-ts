import { defineConfig, presetAttributify, presetUno } from 'unocss'

export default defineConfig({
    shortcuts: [
        {
            'wh-full': 'w-full h-full',
            'flex-center-center': 'flex justify-center items-center',
            'public-show-box-bg': 'bg-black bg-opacity-60', // 弹框背景颜色 -1 包围框颜色
            'b-1-white-solid': 'b-white b-solid b-1',
            'b-1-white-30-solid': 'b-white b-opacity-30 b-solid b-1',
        },
    ],
    rules: [
        ['shadow-water-4', { 'box-shadow': '0 0 4px 4px #73c9c4' }],
    ],
    theme: {
        colors: {
            /** ******************************************************  UI 设计后的颜色 *******************************************************/
            'border-gray': '#cbcbcb', // 边框灰色
            'border-hover-gray': '#cecece', // hover时边框灰色
            'btn-bg-gray': 'rgba(255, 255, 255, 0.15)', // 按钮默认灰色
            'btn-bg-gray-border': '#1e1e1e', // 默认按钮带边框的背景颜色
            'divideGray': '#3d3d3b', // 分割线灰色
            'divideGray-2': '#555555', // 分割线虚线灰色
            'gray-1': '#f6f6f6', // 文本颜色
            'gray-2': '#555957', // 图标按钮背景色
            'gray-3': '#222d29', // AI对话卡片背景颜色-我
            'gray-4': '#000000b3', // menu 菜单控件
            'gray-5': '#1b1b1b', // 聊天背景对话颜色
            'gray-6': '#191919', // 标题栏背景色
            'gray-7': '#505050', // 行动管控底色灰色
            'green-2': '#314a40', //  AI对话卡片背景颜色绿色
            'green-3': '#2c7559', // 卡片对话内容外围， 后面记得提到AI组件里
            'icon-gray': '#444444', // 图标灰色
            'warning-red': '#dc0000', // 警告的红色
            'white-1': '#0d1210', // 线框白色， 偏灰
            'white-2': '#75807c', // 线框白色， 偏灰

            /** ******************************************************  非UI设计颜色，之前使用过的颜色，且还在使用中 *******************************************************/
            'primary': '#409eff', // element primary 颜色
            'blueColor-1': 'rgba(30, 72, 131, 0.5)', // 透明弹窗背景色
            'waterColor': '#73c9c4', // 水色，infowindow 的 shadow 颜色
            'element-dark': '#262727', // 暗黑色，element-drak 的颜色
            'grayColor-4': '#ababab', // 播放条缓存颜色  设备状态颜色
            'greenColor': '#62ff85', // 绿色
            'golden': '#ffd700', // 金色
            'gray-color': '#363637', // border-color
            'grayColor-2': '#797979',

            /** ******************************************************  非UI设计颜色，标准规范颜色，且还在使用中 *******************************************************/
            'light-green-1': '#1c8a5f', // 主题绿色1
            'light-green-3': '#53df92', // 静态文本字体反馈颜色 83,233,146
            // 标牌目标属性状态颜色
            'purple-0': 'rgb(17,72,255)', // 敌方标牌
            'purple-1': 'rgb(227, 0, 229)', // 右方标牌
            'purple-2': 'rgb(200, 0, 0)', // 右方标牌
            'purple-3': 'rgb(0, 200, 0)', // 中力标牌
            // 组件填充背景色
            'gray-fill': '#ffffff41',
            'dark-white': '#e0e0e0',
        },
    },
    presets: [
        presetUno(), // 预设的超集
        presetAttributify(), // 简写
        // presetIcons(), // icons
    ],
})
