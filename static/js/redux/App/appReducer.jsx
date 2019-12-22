import {
    ADD_GRAPH,
    REMOVE_GRAPH,
    ADD_CATEGORY,
    REMOVE_CATEGORY,
    MODIFY_RANGE,
    NEW_DATA_POINTS,
    REMOVE_DATA_POINTS,
    UPDATE_GRAPH_CFG,
} from "./appTypes"
import removeKeys from "../../components/removeKeys"

const INITIAL_STATE = {
        graphs: {},
        ranges: {},
        categories: {},
        pointUpdate: {},
        pointRemove: {},
        pointUpdateId: 0,
        graphsUpdated: [],
        graphUpdateId: 0,
    },
    DEFAULT_RANGE = { rangeType: "past", pastAmount: 9999, pastUnit: "hr" },
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
    nextCatId = 0,
    pointUpdateId = 0,
    graphUpdateId = 0

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

    switch (action.type) {
        case NEW_DATA_POINTS: {
            return {
                ...state,
                pointUpdate: action.payload,
                pointRemove: {},
                pointUpdateId: ++pointUpdateId,
            }
        }
        case REMOVE_DATA_POINTS: {
            return {
                ...state,
                pointUpdate: {},
                pointRemove: action.payload,
                pointUpdateId: ++pointUpdateId,
            }
        }
        case ADD_GRAPH: {
            let rangeId = (nextRangeId++).toString(),
                graphData = {
                    range: rangeId,
                    categories: [],
                    legendDisplay: true,
                    legendPosition: "top",
                    showXAxis: true,
                    downsampEnabled: false,
                    downsampThreshold: 0,
                    gradientDegrees: 0,
                    gradient1: "#222222",
                    gradient2: "#222222",
                }
            return {
                ...state,
                graphs: { ...graphs, [graphId]: graphData },
                ranges: { ...ranges, [rangeId]: DEFAULT_RANGE },
                graphUpdateId: ++graphUpdateId,
                graphsUpdated: [graphId],
            }
        }
        case REMOVE_GRAPH: {
            let curCatIds = new Set(graph.categories)
            return {
                ...state,
                graphs: removeKeys({ ...graphs }, new Set([graphId])),
                ranges: removeKeys({ ...ranges }, new Set([graph.range])),
                categories: removeKeys({ ...cats }, curCatIds),
                graphUpdateId: ++graphUpdateId,
                graphsUpdated: [graphId],
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
                graphUpdateId: ++graphUpdateId,
                graphsUpdated: [graphId],
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
                graphUpdateId: ++graphUpdateId,
                graphsUpdated: [graphId],
            }
        }
        case MODIFY_RANGE: {
            let rangeId = graph.range,
                rangeData = action.payload.rangeData.range
            return {
                ...state,
                ranges: { ...ranges, [rangeId]: rangeData },
                graphUpdateId: ++graphUpdateId,
                graphsUpdated: [graphId],
            }
        }
        case UPDATE_GRAPH_CFG: {
            let newGraph = { ...graph, ...action.payload.cfg }
            return {
                ...state,
                graphs: { ...graphs, [graphId]: newGraph },
                graphUpdateId: ++graphUpdateId,
                graphsUpdated: [graphId],
            }
        }
        default: {
            return state
        }
    }
}

export default appReducer
