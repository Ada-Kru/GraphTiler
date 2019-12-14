import { getGraphCatNames, getRange, getCatData } from "./reduxStateHelpers"
import moment from "moment"

const UNIT_MAP = { sec: "seconds", min: "minutes", hr: "hours" }

class DataSetContainer {
    constructor(graphId, reduxState) {
        this.catData = {}
        this.catIndices = {}
        this.datasets = { datasets: [] }
        this.options = {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 0 },
            legend: { display: true },
            scales: { xAxes: [], yAxes: [] },
        }
        this._reduxState = reduxState
        this._graphId = graphId
    }

    _makeCatOptions = catName => {
        let catData = getCatData(catName, this._graphId, this._reduxState)
        this.catData[catName] = [...this.catData[catName]]
        return {
            ...catData,
            category: catName,
            data: this.catData[catName],
            label: catName,
        }
    }

    _makeXAxisSettings = () => {
        return {
            type: "time",
            distribution: "linear",
            bounds: "ticks",
            time: {
                displayFormats: { hour: "hA MMM D", minute: "HH:mm" },
                labelString: "Time",
                parser: "YYYY-MM-DD HH:mm:ss",
            },
            ticks: { source: "data" },
        }
    }

    _makeYAxisSettings = label => {
        return {
            ticks: { beginAtZero: true },
            scaleLabel: { labelString: label },
        }
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
        let idx = this.datasets.datasets.length
        this.catIndices[catName] = idx
        this.catData[catName] = []
        this.datasets.datasets.push(this._makeCatOptions(catName))
        this.options.scales.xAxes.push(this._makeXAxisSettings())
        this.options.scales.yAxes.push(this._makeYAxisSettings(catName))
    }

    _updateCategory = catName => {
        let idx = this.catIndices[catName]
        this.datasets.datasets[idx] = this._makeCatOptions(catName)
        // this.options.scales.xAxes[idx] = this._makeXAxisSettings()
        // this.options.scales.yAxes[idx] = this._makeYAxisSettings(catName)
    }

    _removeCategories = remove => {
        for (let catName of remove) {
            let idx = this.catIndices[catName]
            this.datasets.datasets.splice(idx, 1)
            this.options.scales.xAxes.splice(idx, 1)
            this.options.scales.yAxes.splice(idx, 1)
            delete this.catData[catName]
            delete this.catIndices[catName]
            this._rebuildCatIndices()
        }
    }

    _removeRemovedCats = newCategories => {
        let newCats = new Set(newCategories),
            removed = []
        for (let catName of Object.keys(this.catData)) {
            if (!newCats.has(catName)) removed.push(catName)
        }
        this._removeCategories(removed)
    }

    updateCats = newCats => {
        this._removeRemovedCats(newCats)
        for (let catName of newCats) {
            if (!this.catData.hasOwnProperty(catName)) {
                this._addCategory(catName)
            } else {
                this._updateCategory(catName)
            }
        }
    }

    updateReduxState = reduxState => {
        this._reduxState = reduxState
    }

    clearAllData = () => {
        for (let cat of Object.keys(this.catData)) {
            let arr = this.catData[cat]
            arr.splice(0, arr.length)
        }
    }

    _findInsertIndex = (arr, value) => {
        let low = 0,
            high = arr.length

        while (low < high) {
            var mid = (low + high) >>> 1
            if (arr[mid].x.isBefore(value.x)) {
                low = mid + 1
            } else {
                high = mid
            }
        }
        return low
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
                // Set end of range to extremely large date to allow for points
                // created for future dates
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

    updatePoints = () => {
        let pointUpdate = this._reduxState.pointUpdate,
            modified = false
        for (let [catName, points] of Object.entries(pointUpdate)) {
            if (this.catData.hasOwnProperty(catName)) {
                let curPoints = this.catData[catName]
                modified = this._insertPoints(curPoints, points) || modified
            }
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
            let i = this._findInsertIndex(curPoints, point)
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
