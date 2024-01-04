export const CESIUM_CONFIG = {
    // 系统所有 layerId 的来源与含义
    DRAW_GRAPH_LAYERID: 'DRAW_GRAPH_LAYERID', // 标绘的 layerId

    DEFAULT_VIEW_RECTANGLE: [80, 22, 130, 55], // 相机查看的默认位置，中国上方
    DEFAULT_VIEW_FACTOR: -0.1, // 相机距离地面距离标量，如果比1小就贴近地面
    DEFAULT_LINE_COLOR: 'yellow', // 默认绘制路径的颜色

    LABEL_FONT: '18px "微软雅黑", Arial, Helvetica, sans-serif, Helvetica', // 默认的展示文案的 font
    DRAW_LINE_COLOR: 'rgba(255,255,0,1)', // 绘制时的基础线条颜色
    DEFAULT_LINE_WIDTH: 2, // 默认的基础线条宽度
    DRAW_LINE_WIDTH: 10, // 绘制时的基础线条宽度
    DRAW_OUTLINE_COLOR: 'rgba(255,0,0,0.7)', // 绘制时的基础线条颜色
    DRAW_RADIUS_LINE_COLOR: 'rgba(0,0,255,0.7)', // 绘制时的基础线条颜色
    DRAW_FILL_COLOR: 'rgba(255,255,0,0.5)', // 绘制时的填充颜色,黄色

    DEFAULT_POINT_IMAGE: 'point.svg', // 默认点的图片

    CESIUM_BASE_URL: 'node_modules/cesium/Build/CesiumUnminified/',
    IMAGERY_PROVIDER_URL: 'node_modules/cesium/Build/CesiumUnminified/Assets/Textures/NaturalEarthII',
    IMG_PROVIDER_DEFAULT: 'images/cq/{z}/{x}/{y}.jpg', // 默认的地图底图
    IMG_PROVIDER_GAODE: 'http://webrd02.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', // 高德地图 https://webst02.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}
    IMG_PROVIDER_GOOGLE: 'http://www.google.com/maps/vt?lyrs=s@716&x={x}&y={y}&z={z}',
}

export const defaultAccessToken
    = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiZmE4NzNlMS0xMDY0LTQzOGItOTI2NS1lYTNiMjc5ZjY2MWIiLCJpZCI6MTMzMDY2LCJpYXQiOjE2ODExODA4MzV9.v4hY4qWVEyk8rvNKiJnpNJl82VyX302WQRolFFWjiwQ'
export const billyangAccessToken
    = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIyZDNlYzY5OS03MzlhLTRlOWEtYjgyMy00NTljNzkxMDI4NzQiLCJpZCI6MTMzMDY2LCJpYXQiOjE2ODExOTkxNzB9.CsRM9UXM-H1hFIsMkg3M6AyhO_VLNOvC8fMZ11Z8Tv8'

// element 上一些组建的配置
export const ELEMENT_COMPONENTS_CONFIG = {
    // colorpicker 预设的颜色
    PRE_DEFINE_COLORS: ['#ff4500', '#ff8c00', '#ffd700', '#90ee90', '#00ced1', '#1e90ff', '#c71585', 'rgba(255, 69, 0, 0.68)', 'rgb(255, 120, 0)',
        'hsv(51, 100, 98)', 'hsva(120, 40, 94, 0.5)', 'hsl(181, 100%, 37%)', 'hsla(209, 100%, 56%, 0.73)', '#c7158577'],
    NAME_MAX_LENGTH: 30, // 取名时最大的长度
    NAME_MIN_LENGTH: 2, // 取名时最小的长度
    DES_MAX_LENGTH: 100, // 描述的最大长度
}
