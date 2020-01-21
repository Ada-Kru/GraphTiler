import {
    ADD_GRAPH,
    REMOVE_GRAPH,
    ADD_CATEGORY,
    MODIFY_CATEGORY,
    REMOVE_CATEGORY,
    MODIFY_RANGE,
    NEW_DATA_POINTS,
    UPDATE_GRAPH_CFG,
    REMOVE_DATA_POINTS,
    LOAD_GRAPH_STATE,
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

export const modifyCategory = (graphId, catData) => {
    return {
        type: MODIFY_CATEGORY,
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

export const newDataPoints = data => {
    return { type: NEW_DATA_POINTS, payload: data }
}

export const removeDataPoints = ranges => {
    return { type: REMOVE_DATA_POINTS, payload: ranges }
}

export const updateGraphCfg = (graphId, cfg) => {
    return { type: UPDATE_GRAPH_CFG, payload: { graphId: graphId, cfg: cfg } }
}

export const loadGraphState = (newState) => {
    return { type: LOAD_GRAPH_STATE, payload: newState }
}
