import type { ParamsObjIF } from '@/types/index'
import { CESIUM_CONFIG } from '@/config'
import { DRAW_GRAPH_MAP, DRAW_GRAPH_MEASURE_MAP, LINE_TYPE_MAP } from '@/constants/index'

// 暴露在外的属性面板可配置参数
export const params = {
    name: '', // 名称
    description: '', // 描述
    masthead: false, // 标头，是否展示绘制图形的name

    lineType: LINE_TYPE_MAP.LINE_GLOW.key, // 普通线条的线型
    lineColor: CESIUM_CONFIG.DRAW_LINE_COLOR, // 线条颜色
    lineWidth: CESIUM_CONFIG.DRAW_LINE_WIDTH, // 线宽

    radiusLineType: LINE_TYPE_MAP.LINE_NORMAL.key, // 半径线型
    radiusLineColor: CESIUM_CONFIG.DRAW_RADIUS_LINE_COLOR, // 半径线条颜色
    radiusLineWidth: 4, // 半径线宽

    outlineType: LINE_TYPE_MAP.LINE_DASHED.key, // 外部边框线型
    outlineColor: CESIUM_CONFIG.DRAW_OUTLINE_COLOR, // 外部边框颜色
    outlineWidth: 2, // 边框线宽

    fillColor: CESIUM_CONFIG.DRAW_FILL_COLOR, // 填充颜色

    radius: 100, // 缓冲区半径

    extrudedHeight: 0,
    // 下面几个是开关，预留后续添加配置参数
    fill: true,
    outline: true,
    line: true,
}

// 绘制的基础配置
export const drawConfig = {
    layerId: CESIUM_CONFIG.DRAW_GRAPH_LAYERID,
    dragIconLight: CESIUM_CONFIG.DEFAULT_POINT_IMAGE, // 绘制时的红点,默认边界点
    dragIcon: 'point_mid.svg', // 绘制时的灰点
    dragIconGreen: 'point_green.svg', // 绘制时的绿点
    ...params,
}

// 可配置参数中一些参数对应的材料名称,paramsName是上方params的参数名，materialName是对应的全局材料名
export const PARAMS_MATERIAL_NAME: { [key: string]: ParamsObjIF } = {
    LINE_TYPE: { type: 'lineType', color: 'lineColor', width: 'lineWidth' },
    OUTLINE_TYPE: { type: 'outlineType', color: 'outlineColor', width: 'outlineWidth' },
    RADIUS_LINE_TYPE: { type: 'radiusLineType', color: 'radiusLineColor', width: 'radiusLineWidth' },
}

// 控制属性面板展示的配置
export const PARAMS_INC_SHAPE = {
    LINE: [DRAW_GRAPH_MAP.LINE.key, DRAW_GRAPH_MAP.BUFFER.key], // 属性面板需要提供基础线条相关配置的图形
    OUT_LINE: [DRAW_GRAPH_MAP.CIRCLE.key, DRAW_GRAPH_MAP.POLYGON.key, DRAW_GRAPH_MAP.RECTANGLE.key, DRAW_GRAPH_MAP.STRAIGHT_ARROW.key, DRAW_GRAPH_MAP.ATTACT_ARROW.key, DRAW_GRAPH_MAP.PINCER_ARROW.key], // 属性面板需要提供边框线条相关配置的图形
    RADIUS_LINE: [DRAW_GRAPH_MAP.CIRCLE.key], // 属性面板需要提供半径线条相关配置的图形
    FILL: [DRAW_GRAPH_MAP.BUFFER.key, DRAW_GRAPH_MAP.CIRCLE.key, DRAW_GRAPH_MAP.POLYGON.key, DRAW_GRAPH_MAP.RECTANGLE.key, DRAW_GRAPH_MAP.STRAIGHT_ARROW.key, DRAW_GRAPH_MAP.ATTACT_ARROW.key, DRAW_GRAPH_MAP.PINCER_ARROW.key], // 属性面板需要提供填充类相关配置的图形
    RADIUS: [DRAW_GRAPH_MAP.BUFFER.key],
}

export const FLAG_MAP = {
    ANCHOR: 'anchor', // 锚点
    MID_ANCHOR: 'mid_anchor', // 中间的修改锚点
}

// 在保存时需要更新位置信息的图形类型,其实就是需要中间锚点的图形
export const SAVE_NEED_UPDATE_POSITION = [DRAW_GRAPH_MAP.LINE.key, DRAW_GRAPH_MAP.POLYGON.key, DRAW_GRAPH_MAP.BUFFER.key]
// 计算tempPositions时使用的是出_computedTempPositions方法的绘制图形
export const TEMP_POSITION_BY__COMPUTED = [DRAW_GRAPH_MAP.POLYGON.key, DRAW_GRAPH_MEASURE_MAP.AREA_MEASURE.key]

// 不需要保存的图形类型
export const UNSAVE_DRAW_TYPE = [DRAW_GRAPH_MEASURE_MAP.POS_MEASURE.key, DRAW_GRAPH_MEASURE_MAP.SPACE_DIS_MEASURE.key, DRAW_GRAPH_MEASURE_MAP.STICK_DIS_MEASURE.key, DRAW_GRAPH_MEASURE_MAP.AREA_MEASURE.key]
