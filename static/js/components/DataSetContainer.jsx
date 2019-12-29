import {
    getGraphCatNames,
    getRange,
    getCatData,
    getGraphData,
} from "./reduxStateHelpers"
import moment from "moment"

const UNIT_MAP = { sec: "seconds", min: "minutes", hr: "hours" }
const DEFAULT_GRAPH_CFG = {
    showXAxis: true,
    fitTimeAxis: true,
    xAxisColor: "#AAAAAA",
}
const DEFAULT_RANGE_CFG = { rangeType: "past", pastAmount: 1, pastUnit: "hr" }

class DataSetContainer {
    constructor(graphId, reduxState) {
        this.catIndices = {}
        this.fullData = {}
        this.datasets = { datasets: [] }
        this._reduxState = reduxState
        this._graphId = graphId
        this._setTzOffset()
        this.options = {
            responsive: true,
            downsample: {
                enabled: true,
                threshold: 50,
                restoreOriginalData: true,
            },
            maintainAspectRatio: false,
            animation: { duration: 0 },
            scales: { xAxes: [this._makeXAxisSettings()], yAxes: [] },
        }
    }

    _setTzOffset = () => {
        let mmt = moment()
        this._tzOffset = mmt.utcOffset() - mmt.isDST() ? 0 : 60
    }

    _makeCatOptions = catName => {
        let catData = getCatData(catName, this._graphId, this._reduxState)
        return {
            ...catData,
            category: catName,
            data: [...this._getCatPoints(catName)],
            yAxisID: catName,
        }
    }

    _makeXAxisSettings = () => {
        let gid = this._graphId,
            graphCfg = getGraphData(gid, this._reduxState) || DEFAULT_GRAPH_CFG,
            rangeCfg = getRange(gid, this._reduxState) || DEFAULT_RANGE_CFG,
            scaleBounds = graphCfg.fitTimeAxis
                ? {}
                : this._makeScaleBounds(rangeCfg)

        return {
            display: graphCfg.showXAxis,
            type: "time",
            distribution: "linear",
            bounds: "ticks",
            time: {
                displayFormats: {
                    hour: "hA MMM D",
                    minute: "HH:mm",
                    second: "HH:mm:ss",
                    millisecond: "HH:mm:ss",
                },
                labelString: "Time",
                parser: utcMoment => {
                    return moment(utcMoment).subtract(this._tzOffset, "minutes")
                },
            },
            ticks: {
                sampleSize: 50,
                fontColor: graphCfg.xAxisColor,
                ...scaleBounds,
            },
        }
    }

    _makeScaleBounds = rangeCfg => {
        let bounds = {}
        switch (rangeCfg.rangeType) {
            case "past":
                let seconds = rangeCfg.pastAmount
                if (rangeCfg.pastUnit === "min") {
                    seconds *= 60
                } else if (rangeCfg.pastUnit === "hr") {
                    seconds *= 3600
                }
                bounds.min = moment.utc().subtract(seconds, "seconds")
                break
            case "since":
                bounds.min = moment.utc(new Date(rangeCfg.since))
                break
            case "timerange":
                bounds.min = moment.utc(new Date(rangeCfg.rangeStart))
                bounds.max = moment.utc(new Date(rangeCfg.rangeEnd))
                break
        }
        return bounds
    }

    _makeYAxisSettings = catData => {
        return {
            display: catData.showYAxis,
            ticks: { beginAtZero: true, fontColor: catData.yAxisColor },
            scaleLabel: { labelString: catData.label },
            type: "linear",
            id: catData.category,
        }
    }

    _getCatPoints = catName => {
        return this.catIndices.hasOwnProperty(catName)
            ? this.fullData[catName]
            : []
    }

    _rebuildCatIndices = () => {
        let newCatIndices = {},
            datasets = this.datasets.datasets
        for (let i = 0; i < datasets.length; i++) {
            newCatIndices[datasets[i].category] = i
        }
        this.catIndices = newCatIndices
    }

    _addCategory = catName => {
        this.fullData[catName] = []
        let idx = this.datasets.datasets.length,
            catData = getCatData(catName, this._graphId, this._reduxState)
        this.datasets.datasets.push(this._makeCatOptions(catName))
        this.catIndices[catName] = idx
        this.options.scales.yAxes.push(this._makeYAxisSettings(catData))
    }

    _updateCategory = catName => {
        let idx = this.catIndices[catName],
            catData = getCatData(catName, this._graphId, this._reduxState)
        this.datasets.datasets[idx] = this._makeCatOptions(catName)
        this.options.scales.yAxes[idx] = this._makeYAxisSettings(catData)
    }

    _removeCategories = remove => {
        if (!remove.length) return
        for (let catName of remove) {
            let idx = this.catIndices[catName]
            this.datasets.datasets.splice(idx, 1)
            delete this.catIndices[catName]
            delete this.fullData[catName]
            this._rebuildCatIndices()
        }
        this.options.scales.yAxes = this.options.scales.yAxes.filter(ele => {
            return !remove.includes(ele.id)
        })
    }

    _removeRemovedCats = newCategories => {
        let newCats = new Set(newCategories),
            removed = []
        for (let catName of Object.keys(this.catIndices)) {
            if (!newCats.has(catName)) removed.push(catName)
        }
        this._removeCategories(removed)
    }

    updateGraphOptions = () => {
        let gd = getGraphData(this._graphId, this._reduxState)
        this.options.legend = {
            display: gd.legendDisplay,
            position: gd.legendPosition,
        }
        this.options.downsample = {
            enabled: gd.downsampEnabled,
            threshold: gd.downsampThreshold,
            restoreOriginalData: true,
        }
        this.options.scales.xAxes[0] = this._makeXAxisSettings()
    }

    updateCats = newCats => {
        this._removeRemovedCats(newCats)
        for (let catName of newCats) {
            if (!this.catIndices.hasOwnProperty(catName)) {
                this._addCategory(catName)
            } else {
                this._updateCategory(catName)
            }
        }
    }

    updateReduxState = reduxState => {
        this._reduxState = reduxState
        this._setTzOffset()
    }

    clearAllData = () => {
        for (let catName of Object.keys(this.catIndices)) {
            let points = this._getCatPoints(catName),
                idx = this.catIndices[catName]
            points.splice(0, points.length)
            this.datasets.datasets[idx].data = []
        }
    }

    _findInsertIndex = (arr, time) => {
        let low = 0,
            high = arr.length

        while (low < high) {
            var mid = (low + high) >>> 1
            if (arr[mid].x.isSame(time)) return mid
            else if (arr[mid].x.isBefore(time)) {
                low = mid + 1
            } else {
                high = mid
            }
        }
        return low
    }

    _findTimePoint = (arr, value) => {
        let low = 0,
            high = arr.length

        while (low < high) {
            var mid = (low + high) >>> 1
            if (arr[mid].x.isSame(value)) return mid
            else if (arr[mid].x.isBefore(value)) {
                low = mid + 1
            } else {
                high = mid
            }
        }
        return -1
    }

    _makeCheckRange = () => {
        let output = {},
            range = getRange(this._graphId, this._reduxState)
        switch (range.rangeType) {
            case "past": {
                let start = moment.utc()
                start.subtract(range.pastAmount, UNIT_MAP[range.pastUnit])
                output.start = start
                output.end = moment.utc()
                break
            }
            case "since": {
                output.start = moment.utc(range.since)
                // Set end of range to an "impossibly" large date to allow for
                // points created for future dates
                output.end = moment.utc(new Date("9999"))
                break
            }
            case "timerange": {
                output.start = moment(range.rangeStart)
                output.end = moment(range.rangeEnd)
                break
            }
        }

        return output
    }

    onBeforeUpdate = () => {
        let gid = this._graphId,
            graphCfg = getGraphData(gid, this._reduxState) || DEFAULT_GRAPH_CFG
        if (!graphCfg.fitTimeAxis) {
            this.options.scales.xAxes[0] = this._makeXAxisSettings()
        }
    }

    removePointsBeforeTime = pastSeconds => {
        let modified = false,
            oldestAllowed = moment.utc().subtract(pastSeconds, "seconds")

        for (let [catName, idx] of Object.entries(this.catIndices)) {
            let allPoints = this._getCatPoints(catName),
                numToRemove = 0
            for (let i = 0; i < allPoints.length; i++) {
                if (!allPoints[i].x.isBefore(oldestAllowed)) {
                    break
                }
                numToRemove++
            }
            if (numToRemove > 0) {
                modified = true
                allPoints.splice(0, numToRemove)
                this.datasets.datasets[idx].data = [...allPoints]
            }
        }

        return modified
    }

    updatedPoints = () => {
        let pointUpdate = this._reduxState.pointUpdate,
            modified = false
        for (let [catName, points] of Object.entries(pointUpdate)) {
            if (this.catIndices.hasOwnProperty(catName)) {
                let allPoints = this._getCatPoints(catName)
                modified = this._insertPoints(allPoints, points) || modified
                if (modified) {
                    let idx = this.catIndices[catName]
                    this.datasets.datasets[idx].data = [...allPoints]
                }
            }
        }
        return modified
    }

    removedPoints = () => {
        let removed = this._reduxState.pointRemove,
            modified = false
        for (let [catName, range] of Object.entries(removed)) {
            if (this.catIndices.hasOwnProperty(catName)) {
                let allPoints = this._getCatPoints(catName)
                modified = this._removePoints(allPoints, range) || modified
                if (modified) {
                    let idx = this.catIndices[catName]
                    this.datasets.datasets[idx].data = [...allPoints]
                }
            }
        }
        return modified
    }

    _removePoints = (curPoints, range) => {
        if (!curPoints.length) return
        let modified = false
        if (range.hasOwnProperty("all")) {
            curPoints.splice(0, curPoints.length)
            modified = true
        }
        if (range.hasOwnProperty("times")) {
            for (let tm of range.times) {
                if (!curPoints.length) break
                let idx = this._findTimePoint(curPoints, tm)
                if (idx !== -1 && curPoints[idx].x.isSame(tm)) {
                    curPoints.splice(idx, 1)
                    modified = true
                }
            }
        }
        if (range.hasOwnProperty("since") && curPoints.length) {
            let idx = this._findInsertIndex(curPoints, range.since)
            curPoints.splice(idx, curPoints.length)
            modified = true
        }
        if (range.hasOwnProperty("range") && curPoints.length) {
            let start = this._findInsertIndex(curPoints, range.range.start)
            let end = this._findInsertIndex(curPoints, range.range.end)
            curPoints.splice(start, end)
            modified = true
        }
        return modified
    }

    _insertPoints = (curPoints, newPoints) => {
        let range = getRange(this._graphId, this._reduxState),
            dataModified = false,
            { start, end } = this._makeCheckRange(range)

        for (let point of newPoints) {
            if (!point.x.isBetween(start, end, null, "[]")) {
                continue
            }

            dataModified = true
            let i = this._findInsertIndex(curPoints, point.x)
            curPoints.splice(i, 0, point)
            let tm = point.x,
                len = curPoints.length
            if (i > 0 && curPoints[i - 1].x.isSame(tm)) {
                curPoints.splice(i - 1, 1)
            } else if (i < len - 1 && curPoints[i + 1].x.isSame(tm)) {
                curPoints.splice(i + 1, 1)
            }
        }

        return dataModified
    }
}

export default DataSetContainer
