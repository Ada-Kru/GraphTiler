import { ADD_GRAPH, REMOVE_GRAPH } from "./appTypes"

export const addGraph = graphId => {
    return { type: ADD_GRAPH, payload: { graphId: graphId } }
}

export const removeGraph = graphId => {
    return { type: REMOVE_GRAPH, payload: { graphId: graphId } }
}
