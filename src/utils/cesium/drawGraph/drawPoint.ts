import type { Viewer } from 'cesium'
import { ScreenSpaceEventHandler, ScreenSpaceEventType } from 'cesium'

import DrawGraphBase from './drawBase'
import { FLAG_MAP } from './config'

import type { DrawConfigIF, DrawEntity, DrawStagingData } from '@/types/index'

import { DRAW_GRAPH_MAP } from '@/constants/index'

export default class DrawGraphPoint extends DrawGraphBase {
    constructor(viewer: Viewer) {
        super(viewer)

        this.viewer = viewer
        this.drawHandler = new ScreenSpaceEventHandler(viewer.scene.canvas)
        this.drawType = DRAW_GRAPH_MAP.POINT.key
    }

    startDraw() {
        this.entity = undefined
        this.positions = []

        this.drawHandler?.setInputAction((movement: any) => {
            const cartesian = this.checkPosition(movement.position)
            if (!cartesian)
                return
            this.positions = [cartesian]
            if (this.entity)
                this.entity.position = this.transConstantPositionProperty(cartesian)
            this.tooltip.setVisible(false)
            this.tempPositions = this.cloneDeep(this.positions)
            this.startModify()
        }, ScreenSpaceEventType.LEFT_CLICK)

        this.drawHandler?.setInputAction((movement: any) => {
            this.tooltip.showAt(movement.endPosition, '选择位置')
            const cartesian = this.checkPosition(movement.endPosition)
            if (!cartesian)
                return

            this.positions = [cartesian]
            if (!this.entity)
                this.entity = this.createPoint(this.positions[0], { oid: 0, label: this.getCommonLabel() })
            else
                this.entity.position = this.transConstantPositionProperty(cartesian)
        }, ScreenSpaceEventType.MOUSE_MOVE)
    }

    startModify() {
        let isMoving = false
        let pickedAnchor: DrawEntity
        this.drawingToModify()
        this.layerShowOrHide(true)

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
                    this.tempPositions = [cartesian]
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
            this.tempPositions = [cartesian]
        }, ScreenSpaceEventType.MOUSE_MOVE)
    }

    reEnterModify(stagingData: DrawStagingData) {
        this.setReEnterParams(stagingData)
        this.tempPositions = this.cloneDeep(stagingData.saveData.positions)
        this.entity = undefined
        this.entity = this.createPoint(this.tempPositions[0], { oid: 0, label: this.getCommonLabel() })
        this.startModify()
    }

    drawOldData(stagingData: DrawStagingData) {
        this.setReEnterParams(stagingData)
        this.tempPositions = this.cloneDeep(stagingData.saveData.positions)

        if (this.tempPositions)
            this.createPoint(this.tempPositions[0], { oid: 0, label: this.getCommonLabel() })
    }

    // 更新绘制的图形配置
    updateConfig(config: DrawConfigIF) {
        this.config = config
        this.updatePublicParams()
    }
}
