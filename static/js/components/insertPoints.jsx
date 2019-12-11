import moment from "moment"

const UNIT_MAP = {sec: "seconds", min: "minutes", hr: "hours"}

const findInsertIndex = (arr, value) => {
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

const makeCheckRange = (range) => {
    let output = {}
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
            output.end = moment.utc(new Date('9999'))
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

const insertPoints = (curPoints, newPoints, range) => {
    let checkRange = makeCheckRange(range)
    for (let point of newPoints) {
        if (!point.x.isBetween(checkRange.start, checkRange.end, null, '[]')) {
            continue
        }

        let i = findInsertIndex(curPoints, point)
        curPoints.splice(i, 0, point)
        let tm = point.x
        if (i > 0 && curPoints[i - 1].x.isSame(tm)) {
            curPoints.splice(i - 1, 1)
        } else if (i < curPoints.length - 1 && curPoints[i + 1].x.isSame(tm)) {
            curPoints.splice(i + 1, 1)
        }
    }
}

export default insertPoints
