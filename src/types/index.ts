import type { Cartesian3, Color, Entity } from 'cesium'

export interface DrawSignIF {
    layerId?: string
    timeStampId?: number
    drawType?: string

    oid?: number
    sid?: number
    flag?: string
}

export interface Position {
    lon: number // 经度
    lat: number // 经纬度

    height?: number // 高度
    alt?: number // 高度
}

// 绘制属性面板可配置属性
export interface DrawConfigIF {
    name: string // 名称
    description: string // 描述
    masthead: boolean // 标头，是否展示绘制图形的name

    lineType: string // 线型
    lineWidth: number // 线宽
    lineColor: string // 线条颜色,rgba形式

    outlineType: string // 边框线型
    outlineColor: string // 边框颜色
    outlineWidth: number // 边框线宽

    radiusLineType: string // 半径线型
    radiusLineColor: string // 半径线条颜色
    radiusLineWidth: number // 半径线宽

    fillColor: string // 填充颜色,rgba形式

    fill: boolean
    outline: boolean
    extrudedHeight: number
    radius: number
    line: boolean
}

export interface SaveDataIF {
    timeStampId?: number
    custom?: Array<number[]>
    radius?: number
    positions: Array<DrawCartesian3>
    locations?: Array<number[]>
}

// 暂存的绘制数据
export interface DrawStagingData {
    saveData: SaveDataIF
    config?: DrawConfigIF
}

// 每种线条对应的配置
export interface ParamsObjIF {
    type: string
    color: string
    width: string
}

export interface DrawEntity extends Entity, DrawSignIF { }

export interface DrawCartesian3 extends Cartesian3 {
    sid?: number
    oid?: number
}

// 创建点的时候的 options
export interface CreatePointOpt {
    oid: number
    image?: string
    flag?: string
    needSave?: boolean // 是否需要保留
    label?: Object // 文案提示
}

export interface PosInterface {
    lon: number
    lat: number
    alt: number
    height: number
    sid?: number
    oid?: number
}

export interface MaterialsIF {
    lineType: Color | undefined | any
    outlineType: Color | undefined | any
    radiusLineType: Color | undefined | any
}

// 地图选点
export interface SelPointOptionsIF {
    isSave?: boolean // 是否保留
    image?: string // 选点的提示图片
    pickData?: { // 有些选点是要在地图上的已绘制图形上的，所以这个pickData用来存储该图形的信息
        entityId?: string // 需要作为参考的entityId
        checkPick?: boolean // 是否要验证绘制在图形上
        needInPick?: boolean // 需要在图形内部
        timeStampId?: number
        layerId?: string
        drawType?: string
    }
}
