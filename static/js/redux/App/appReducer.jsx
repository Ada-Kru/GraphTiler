import {
    ADD_GRAPH,
    REMOVE_GRAPH,
    ADD_CATEGORY,
    REMOVE_CATEGORY,
    MODIFY_RANGE,
} from "./appTypes"
import removeKeys from "../../components/removeKeys"

const INITIAL_STATE = { graphs: {}, ranges: {}, categories: {} },
    DEFAULT_RANGE = { rangeType: "past", pastAmount: 1, pastUnit: "hr" },
    GRAPH_TYPES = new Set([
        REMOVE_GRAPH,
        ADD_CATEGORY,
        REMOVE_CATEGORY,
        MODIFY_RANGE,
    ])

const findGraphCatId = (cat, allCats, graphCats) => {
    for (let [key, val] of Object.entries(allCats)) {
        if (val.category === cat && graphCats.includes(key)) {
            return key
        }
    }
    return ""
}

let nextRangeId = 0,
    nextCatId = 0

const appReducer = (state = INITIAL_STATE, action) => {
    let type = action.type,
        isGraphType = GRAPH_TYPES.has(type)
    if (
        !action.hasOwnProperty("payload") ||
        (isGraphType && !state.graphs.hasOwnProperty(action.payload.graphId))
    ) {
        return state
    }

    let graphId = action.payload.graphId,
        graphs = state.graphs,
        graph = graphs[graphId],
        ranges = state.ranges,
        cats = state.categories
    // let graphIds = Object.keys(graphs)
    // let rangesIds = Object.keys(ranges)
    // let catIds = Object.keys(cats)

    switch (action.type) {
        case ADD_GRAPH: {
            let rangeId = (nextRangeId++).toString(),
                graphData = { range: rangeId, categories: [] }
            return {
                ...state,
                graphs: { ...graphs, [graphId]: graphData },
                ranges: { ...ranges, [rangeId]: DEFAULT_RANGE },
            }
        }
        case REMOVE_GRAPH: {
            let curCatIds = new Set(graph.categories)
            return {
                ...state,
                graphs: removeKeys({ ...graphs }, new Set([graphId])),
                ranges: removeKeys({ ...ranges }, new Set([graph.range])),
                categories: removeKeys({ ...cats }, curCatIds),
            }
        }
        case ADD_CATEGORY: {
            let category = action.payload.catData.category,
                catId = (nextCatId++).toString(),
                newGraphCats = [...graph.categories, catId],
                newGraph = { ...graph, categories: newGraphCats }

            return {
                ...state,
                categories: { ...cats, [catId]: action.payload.catData },
                graphs: { ...state.graphs, [graphId]: newGraph },
            }
        }
        case REMOVE_CATEGORY: {
            let searchCat = action.payload.category,
                remId = findGraphCatId(searchCat, cats, graph.categories)
            if (!remId) {
                return state
            }

            let newGraphCats = graph.categories.filter(x => x !== remId),
                newGraph = { ...graph, categories: newGraphCats }
            return {
                ...state,
                graphs: { ...graphs, [graphId]: newGraph },
                categories: removeKeys({ ...cats }, new Set([remId])),
            }
        }
        case MODIFY_RANGE: {
            let rangeId = graph.range,
                rangeData = action.payload.rangeData.range
            return { ...state, ranges: { ...ranges, [rangeId]: rangeData } }
        }
        default: {
            return state
        }
    }
}

export default appReducer
