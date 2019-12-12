export const getCatIds = (graphId, state) => {
    return state.graphs[graphId] ? state.graphs[graphId].categories : []
}

export const getGraphCatNames = (graphId, state) => {
    let catNames = []
    for (let catId of getCatIds(graphId, state)) {
        catNames.push(state.categories[catId].category)
    }
    return catNames
}

export const getCatData = (catName, graphId, state) => {
    for (let catId of getCatIds(graphId, state)) {
        if (state.categories[catId].category === catName) {
            return state.categories[catId]
        }
    }
}

export const getRange = (graphId, state) => {
    return state.ranges[state.graphs[graphId].range]
}
