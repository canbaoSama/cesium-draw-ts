// 操作状态
import { Cartesian2, Color, HeightReference, LabelStyle } from 'cesium'

import { CESIUM_CONFIG } from '@/config'

export const OPERATE_STATUS = {
    NONE: 'none', // 无操作状态
    ADD: 'add', // 新增
    EDIT: 'edit', // 编辑
    UPDATE: 'update', // 更新
    DELETE: 'delete', // 删除
    DETAIL: 'detail', // 详情
    SELECT: 'select', // 选择
    START: 'start', // 开始
    PAUSE: 'pause', // 暂停
    REVERT: 'revert', // 恢复
    END: 'end', // 终止
}
export const OPERATE_STATUS_MAP: { [key: string]: string } = {
    none: '',
    add: '创建',
    edit: '编辑',
    delete: '删除',
    detail: '详情',
    start: '开始',
    pause: '暂停',
    revert: '恢复',
    end: '结束',
}

// 全局默认的绘制entity的label的text展示
export const ENTITY_LABEL_DEFAULT_CONFIG = {
    font: CESIUM_CONFIG.LABEL_FONT,
    fillColor: Color.AQUA,
    lineColor: Color.SKYBLUE,
    outlineWidth: 1,
    pixelOffset: new Cartesian2(0, 40),
    style: LabelStyle.FILL_AND_OUTLINE,
    heightReference: HeightReference.CLAMP_TO_GROUND,
    disableDepthTestDistance: Number.POSITIVE_INFINITY,
}

// 绘制部分的线条类型
export const LINE_TYPE_MAP: { [key: string]: { key: string; value: string; glowPower?: number } } = {
    LINE_NORMAL: { key: 'LINE_NORMAL', value: '普通线条' },
    LINE_DASHED: { key: 'LINE_DASHED', value: '虚线线条' },
    LINE_ARROW: { key: 'LINE_ARROW', value: '箭头线条' },
    LINE_GLOW: { key: 'LINE_GLOW', value: '发光线条', glowPower: 0.25 },
}

// 绘制图形的功能列表
export const DRAW_GRAPH_MAP: { [key: string]: any } = {
    POINT: { key: 'POINT', name: '点', type: 'primary', drawFunc: 'DrawGraphPoint', image: 'draw_point.png' },
    LINE: { key: 'LINE', name: '折线', type: 'primary', drawFunc: 'DrawGraphLine', image: 'draw_line.png' },
    CIRCLE: { key: 'CIRCLE', name: '圆形', type: 'primary', drawFunc: 'DrawGraphCircle', image: 'draw_circle.png' },
    // ELLIPSE: { key: 'ELLIPSE', name: '椭圆', type: 'primary', disabled: true, drawFunc: 'DrawGraphLine' },
    POLYGON: { key: 'POLYGON', name: '多边形', type: 'primary', drawFunc: 'DrawGraphPolygon', image: 'draw_polygon.png' },
    RECTANGLE: { key: 'RECTANGLE', name: '矩形', type: 'primary', drawFunc: 'DrawGraphRectangle', image: 'draw_rectangle.png' },
    BUFFER: { key: 'BUFFER', name: '缓冲区', type: 'primary', drawFunc: 'DrawGraphBuffer', image: 'draw_buffer.png' },

    STRAIGHT_ARROW: { key: 'STRAIGHT_ARROW', name: '直线箭头', type: 'warning', drawFunc: 'DrawGraphStraightArrow', image: 'draw_straight_arrow.png' },
    ATTACT_ARROW: { key: 'ATTACT_ARROW', name: '攻击箭头', type: 'warning', drawFunc: 'DrawGraphAttactArrow', image: 'draw_attact_arrow.png' },
    PINCER_ARROW: { key: 'PINCER_ARROW', name: '钳击箭头', type: 'warning', drawFunc: 'DrawGraphPincerArrow', image: 'draw_pincer_arrow.png' },
}
// 绘制图形的测量功能列表
export const DRAW_GRAPH_MEASURE_MAP: { [key: string]: any } = {
    POS_MEASURE: { key: 'POS_MEASURE', name: '坐标查询', type: 'success', drawFunc: 'DrawGraphPosMeasure' },
    SPACE_DIS_MEASURE: { key: 'SPACE_DIS_MEASURE', name: '空间距离', type: 'success', drawFunc: 'DrawGraphSpaceDisMeasure' },
    STICK_DIS_MEASURE: { key: 'STICK_DIS_MEASURE', name: '贴地距离', type: 'success', drawFunc: 'DrawGraphStickDisMeasure' },
    AREA_MEASURE: { key: 'AREA_MEASURE', name: '面积量算', type: 'success', drawFunc: 'DrawGraphAreaMeasure' },
    ANGLE_BETWEEN: { key: 'ANGLE_BETWEEN', name: '夹角角度', type: 'success', drawFunc: 'DrawGraphAngleBtwMeasure' },
    ANGLE_PITCH: { key: 'ANGLE_PITCH', name: '俯仰角度', type: 'success', drawFunc: 'DrawGraphAnglePitchMeasure' },
}

// 绘制确认
export const DRAW_CONFIRM = {
    CANCEL: 'CANCEL',
    STAGING: 'STAGING',
}
