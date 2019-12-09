import { ADD_GRAPH, REMOVE_GRAPH } from "./appTypes"
import removeKeys from "../../components/removeKeys"

const initialState = {
    graphs: {
        byId: {},
        allIds: [],
    },
    ranges: {
        byId: {},
        allIds: [],
    },
    categories: {
        byId: {},
        allIds: [],
    },
}

const appReducer = (state = initialState, action) => {
    console.log("reducer called: ", action, state)
    switch (action.type) {
        case ADD_GRAPH: {
            let graphId = action.payload.graphId
            let ids = state.ranges.allIds
            let rangeId = ids.length ? ids[ids.length - 1] + 1 : 0
            return {
                ...state,
                graphs: {
                    ...state.graphs,
                    byId: {
                        ...state.graphs.byId,
                        [graphId]: { range: rangeId, categories: [] },
                    },
                    allIds: [...state.graphs.allIds, graphId],
                },
                ranges: {
                    ...state.ranges,
                    byId: {
                        ...state.ranges.byId,
                        [rangeId]: {
                            rangeType: "past",
                            pastAmount: 1,
                            pastUnit: "hr",
                        },
                    },
                    allIds: [...state.ranges.allIds, rangeId],
                },
            }
        }
        case REMOVE_GRAPH: {
            let graphId = action.payload.graphId
            if (!state.graphs.byId.hasOwnProperty(graphId)) {
                return state
            }

            let graph = state.graphs.byId[graphId]
            let catById = state.categories.byId
            let catsAllIds = state.categories.allIds
            let graphById = state.graphs.byId
            let graphAllIds = state.graphs.allIds
            let rangesById = state.ranges.byId
            let rangesAllIds = state.ranges.allIds

            let catIds = new Set([graph.categories])
            let newCatsById = removeKeys({ ...catById }, catIds)
            let newCatsAllIds = catsAllIds.filter(x => !catIds.has(x))
            let newGraphById = removeKeys({ ...graphById }, new Set([graphId]))
            let newGraphAllIds = graphAllIds.filter(x => x !== graphId)
            let rangeId = graph.range
            let newRangesById = removeKeys(
                { ...rangesById },
                new Set([rangeId])
            )
            let newRangesAllIds = rangesAllIds.filter(x => x !== rangeId)

            return {
                ...state,
                categories: {
                    ...state.categories,
                    byId: { ...catById, ...newCatsById },
                    allIds: { ...catsAllIds, ...newCatsAllIds },
                },
                graphs: {
                    ...state.graphs,
                    byId: newGraphById,
                    allIds: newGraphAllIds,
                },
                ranges: {
                    ...state.ranges,
                    byId: newRangesById,
                    allIds: newRangesAllIds,
                },
            }
        }
        default: {
            return state
        }
    }
}

export default appReducer
