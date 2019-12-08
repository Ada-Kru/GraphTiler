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

const insertPoints = (curPoints, newPoints) => {
    for (let point of newPoints) {
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
