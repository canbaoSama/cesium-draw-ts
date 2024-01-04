import type { Viewer } from 'cesium'
import { ScreenSpaceEventHandler, ScreenSpaceEventType } from 'cesium'

import DrawGraphBase from './drawBase'
import { FLAG_MAP } from './config'

import { DRAW_GRAPH_MEASURE_MAP } from '@/constants/index'
import type { DrawCartesian3, DrawEntity, PosInterface } from '@/types/index'

export default class DrawGraphPosMeasure extends DrawGraphBase {
    constructor(viewer: Viewer) {
        super(viewer)

        this.viewer = viewer
        this.drawHandler = new ScreenSpaceEventHandler(viewer.scene.canvas)
        this.drawType = DRAW_GRAPH_MEASURE_MAP.POS_MEASURE.key
    }

    startDraw() {
        this.entity = undefined
        this.positions = []

        this.drawHandler?.setInputAction((movement: any) => {
            const cartesian = this.checkPosition(movement.position)
            if (!cartesian)
                return
            this.setLabelParams(cartesian)
            this.tooltip.setVisible(false)
            this.startModify()
        }, ScreenSpaceEventType.LEFT_CLICK)

        this.drawHandler?.setInputAction((movement: any) => {
            this.tooltip.showAt(movement.endPosition, '选择位置')
            const cartesian = this.checkPosition(movement.endPosition)
            if (!cartesian)
                return

            this.positions = [cartesian]
            this.setLabelParams(cartesian)
            if (!this.entity)
                this.entity = this._createPoint(this.positions[0])
        }, ScreenSpaceEventType.MOUSE_MOVE)
    }

    setLabelParams(cartesian: DrawCartesian3) {
        this.positions = [cartesian]
        if (this.entity) {
            this.entity.position = this.transConstantPositionProperty(cartesian)
            if (this.entity.label) {
                const text = this.getMeasureTip(this.positions[0])
                this.entity.label.text = this.transConstantProperty(text)
            }
        }
    }

    startModify() {
        let isMoving = false
        let pickedAnchor: DrawEntity
        this.drawingToModify()
        // this.layerShowOrHide(true)

        this.modifyHandler = new ScreenSpaceEventHandler(this.viewer.scene.canvas)

        this.modifyHandler.setInputAction((movement: any) => {
            const cartesian = this.checkPosition(movement.position)
            if (!cartesian)
                return

            if (isMoving) {
                isMoving = false
                const oid = pickedAnchor.oid

                if (typeof oid === 'number' && oid >= 0) {
                    pickedAnchor.position = this.transConstantPositionProperty(cartesian)
                    this.positions = [cartesian]
                    this.tooltip.setVisible(false)
                }
            }
            else {
                const pickedObject = this.checkModifyPosition(movement.position)
                if (!pickedObject)
                    return

                const entity = pickedObject.id
                if (entity.layerId !== this.layerId || entity.flag !== FLAG_MAP.ANCHOR)
                    return

                pickedAnchor = entity
                isMoving = true
                this.tooltip.showAt(movement.position, '移动位置')
            }
        }, ScreenSpaceEventType.LEFT_CLICK)

        this.modifyHandler.setInputAction((movement: any) => {
            if (!isMoving)
                return

            this.tooltip.showAt(movement.endPosition, '移动位置')

            const cartesian = this.checkPosition(movement.endPosition)
            if (!cartesian)
                return

            pickedAnchor.position = this.transConstantPositionProperty(cartesian)
            this.positions = [cartesian]
            const text = this.getMeasureTip(this.positions[0])
            if (this.entity?.label)
                this.entity.label.text = this.transConstantProperty(text)
        }, ScreenSpaceEventType.MOUSE_MOVE)
    }

    _createPoint(cartesian3: DrawCartesian3) {
        const text = this.getMeasureTip(cartesian3)
        const label = this.getCommonLabel(text)
        return this.createPoint(cartesian3, { oid: 0, label })
    }

    getMeasureTip(cartesian: DrawCartesian3) {
        const pos: PosInterface = this.change_3D_to_map_lonAndLat(cartesian)

        pos.alt = parseFloat(pos.alt.toFixed(1))
        pos.lon = parseFloat(pos.lon.toFixed(3))
        pos.lat = parseFloat(pos.lat.toFixed(3))
        const tip = `经度：${pos.lon}, 纬度：${pos.lat}\n 海拔: ${pos.alt}米`
        return tip
    }
}
