import {
    ADD_GRAPH,
    REMOVE_GRAPH,
    ADD_CATEGORY,
    REMOVE_CATEGORY,
    MODIFY_RANGE
} from "./appTypes"

export const addGraph = graphId => {
    return { type: ADD_GRAPH, payload: { graphId: graphId } }
}

export const removeGraph = graphId => {
    return { type: REMOVE_GRAPH, payload: { graphId: graphId } }
}

export const addCategory = (graphId, catData) => {
    return {
        type: ADD_CATEGORY,
        payload: { graphId: graphId, catData: catData },
    }
}

export const removeCategory = (graphId, category) => {
    return {
        type: REMOVE_CATEGORY,
        payload: { graphId: graphId, category: category },
    }
}

export const modifyRange = (graphId, rangeData) => {
    return {
        type: MODIFY_RANGE,
        payload: { graphId: graphId, rangeData: rangeData },
    }
}
