import type { Viewer } from 'cesium'
import { Cartesian3, Color, ColorMaterialProperty, EllipseGeometryLibrary, PolylineArrowMaterialProperty, PolylineDashMaterialProperty, PolylineGlowMaterialProperty, defined } from 'cesium'

import * as turf from '@turf/turf'

import { CESIUM_CONFIG } from '@/config'

import { LINE_TYPE_MAP } from '@/constants/index'

import type { DrawCartesian3, Position } from '@/types/index'

export function requireImage(name: string) {
    return new URL(`../assets/images/${name}`, import.meta.url).href
}
// 角度转弧度
export function degToRad(deg: number) {
    return Math.PI * deg / 180
}
// 弧度转角度
export function radToDeg(rad: number) {
    return rad * 180 / Math.PI
}

// 检查 position
export function checkPosition(viewer: Viewer, position: Cartesian3) {
    if (!defined(position))
        return false

    const ray = viewer.camera.getPickRay(position)
    if (ray && defined(ray)) {
        const cartesian = viewer.scene.globe.pick(ray, viewer.scene)
        if (cartesian && defined(cartesian))
            return cartesian
    }

    return false
}

// 3D 坐标转换成经纬度, 数组形式
export function change_3D_to_lonAndLat(viewer: Viewer, position: Cartesian3) {
    const cartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(position)
    return [radToDeg(cartographic.longitude), radToDeg(cartographic.latitude), cartographic.height || 0]
}
// 3D 坐标转换成经纬度, 数组形式
export function change_3D_to_lonAndLat_arr(viewer: Viewer, positions: Array<Cartesian3>) {
    const locations: Array<number[]> = []
    positions.forEach((position: Cartesian3) => {
        locations.push(change_3D_to_lonAndLat(viewer, position))
    })
    return locations
}
// 3D 坐标转换成经纬度, Position形式
export function change_3D_to_map_lonAndLat(viewer: Viewer, position: Cartesian3) {
    const cartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(position)
    return { lon: radToDeg(cartographic.longitude), lat: radToDeg(cartographic.latitude), alt: cartographic.height || 0, height: cartographic.height || 0 }
}
// 3D 坐标转换成经纬度, Position数组形式
export function change_3D_to_map_lonAndLat_arr(viewer: Viewer, positions: Array<Cartesian3>) {
    const locations: Array<Position> = []
    positions.forEach((position: Cartesian3) => {
        locations.push(change_3D_to_map_lonAndLat(viewer, position))
    })
    return locations
}

// 将rgba string类型颜色转换成cesium需要的颜色形式
export function rgbaStringToCesiumColor(rgbaString: Color | string, opacity?: number) {
    if (defined(rgbaString) && (rgbaString instanceof Color)) { return rgbaString }

    else if (typeof rgbaString === 'string') {
        if (rgbaString.includes('#')) { // '#ffffff' 形式
            const bigint = parseInt(rgbaString.slice(1), 16)
            const r = ((bigint >> 16) & 255) / 255
            const g = ((bigint >> 8) & 255 / 255)
            const b = (bigint & 255) / 255
            return new Color(r, g, b, opacity || 1)
        }
        else if (rgbaString.includes('rgb')) {
            const rgbaComponents = rgbaString.substring(5, rgbaString.length - 1).split(',')
            if (Array.isArray(rgbaComponents) && rgbaComponents.length >= 3) {
                const red = parseFloat(rgbaComponents[0].trim()) / 255.0
                const green = parseFloat(rgbaComponents[1].trim()) / 255.0
                const blue = parseFloat(rgbaComponents[2].trim()) / 255.0
                const alpha = parseFloat(rgbaComponents[3]?.trim()) || opacity || 1
                return new Color(red, green, blue, alpha)
            }
        }

        return Color.fromCssColorString(rgbaString) || Color.YELLOW
    }
    return Color.YELLOW
}

// 获取数据最中间的参数
export function getArrMidElement(arr: Array<any>) {
    if (arr.length === 0)
        return null // 如果数组为空，则返回 null 或者适当的默认值

    const middleIndex = Math.floor(arr.length / 2)
    return arr[middleIndex]
}

// 计算出线条材料类型
export function getLineMaterial(lineType?: string, color?: string) {
    let material
    switch (lineType) {
        case LINE_TYPE_MAP.LINE_NORMAL.key:
            material = new ColorMaterialProperty(
                rgbaStringToCesiumColor(color || CESIUM_CONFIG.DEFAULT_LINE_COLOR),
            )
            break
        case LINE_TYPE_MAP.LINE_DASHED.key:
            material = new PolylineDashMaterialProperty({
                color: rgbaStringToCesiumColor(color || CESIUM_CONFIG.DEFAULT_LINE_COLOR),
            })
            break
        case LINE_TYPE_MAP.LINE_ARROW.key:
            material = new PolylineArrowMaterialProperty(
                rgbaStringToCesiumColor(color || CESIUM_CONFIG.DEFAULT_LINE_COLOR),
            )
            break
        case LINE_TYPE_MAP.LINE_GLOW.key:
            material = new PolylineGlowMaterialProperty({
                glowPower: LINE_TYPE_MAP.LINE_GLOW.glowPower,
                color: rgbaStringToCesiumColor(color || CESIUM_CONFIG.DEFAULT_LINE_COLOR),
            })
            break
        default:
            material = new PolylineGlowMaterialProperty({
                glowPower: LINE_TYPE_MAP.LINE_GLOW.glowPower,
                color: rgbaStringToCesiumColor(color || CESIUM_CONFIG.DEFAULT_LINE_COLOR),
            })
            break
    }

    return material
}
// 计算缓冲区线条
export function computeBufferLine(viewer: Viewer, positions: Array<DrawCartesian3>, radius: number, widthHeight?: boolean) {
    const arr = []
    const num = positions.length
    let defaultHeight = 0
    for (let i = 0; i < num; i++) {
        const p = change_3D_to_map_lonAndLat(viewer, positions[i])
        if (i === 0)
            defaultHeight = p.height || 0

        arr.push(widthHeight ? [p.lon, p.lat, p.height || 0] : [p.lon, p.lat])
    }

    const line = turf.lineString(arr)
    const feature = turf.buffer(line, radius * 1, { units: 'meters' })
    const coordinates = feature.geometry.coordinates
    if (!coordinates || coordinates.length < 1)
        return null

    const pnts = coordinates[0]
    if (!pnts || pnts.length < 3)
        return null

    const linePositions = []
    for (let j = 0; j < pnts.length; j++) {
        const p = pnts[j]
        const c = widthHeight ? Cartesian3.fromDegrees(p[0], p[1], defaultHeight) : Cartesian3.fromDegrees(p[0], p[1])
        linePositions.push(c)
    }

    return linePositions
}

// 计算位置中心
export function computeCenterPotition(points: Array<DrawCartesian3>) {
    const center = new Cartesian3()
    if (points.length === 0)
        return center // 如果数组为空，则返回 null 或者适当的默认值

    const sum = new Cartesian3()

    for (let i = 0; i < points.length; i++)
        Cartesian3.add(sum, points[i], sum)

    Cartesian3.divideByScalar(sum, points.length, center)
    return center
}
// 计算两个点的长度
export function computeCircleRadius3D(positions: Array<DrawCartesian3>) {
    const c1 = positions[0]
    const c2 = positions[1]
    const x = (c1.x - c2.x) ** 2
    const y = (c1.y - c2.y) ** 2
    const z = (c1.z - c2.z) ** 2
    const dis = Math.sqrt(x + y + z)
    return dis
}
// 计算圆形的图形数据
export function computeCirclePolygon(positions: Array<DrawCartesian3>) {
    try {
        if (!positions || positions.length < 2)
            return undefined

        const cp = positions[0]
        const r = computeCircleRadius3D(positions)
        const pnts = computeCirclePolygon2(cp, r)
        return pnts
    }
    catch (err) {
        return undefined
    }
}
export function computeCirclePolygon2(center: DrawCartesian3, radius: number) {
    try {
        if (!center || radius <= 0)
            return undefined

        const cep = EllipseGeometryLibrary.computeEllipsePositions({
            center,
            semiMajorAxis: radius,
            semiMinorAxis: radius,
            rotation: 0,
            granularity: 0.005,
        }, false, true)
        if (!cep || !cep.outerPositions)
            return undefined

        const pnts = Cartesian3.unpackArray(cep.outerPositions)
        const first = pnts[0]
        pnts[pnts.length] = first
        return pnts
    }
    catch (err) {
        return undefined
    }
}
