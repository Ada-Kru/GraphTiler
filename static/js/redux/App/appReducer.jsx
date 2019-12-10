import {
    ADD_GRAPH,
    REMOVE_GRAPH,
    ADD_CATEGORY,
    REMOVE_CATEGORY,
} from "./appTypes"
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
    if (
        action.type === ADD_GRAPH ||
        action.type === REMOVE_GRAPH ||
        action.type === ADD_CATEGORY ||
        action.type === REMOVE_CATEGORY
    ) {
        if (!state.graphs.byId.hasOwnProperty(action.payload.graphId)) {
            return state
        }
    }
    let graphId = action.payload.graphId
    let graph = state.graphs.byId[graphId]
    let catById = state.categories.byId
    let catsAllIds = state.categories.allIds
    let graphById = state.graphs.byId
    let graphAllIds = state.graphs.allIds
    let rangesById = state.ranges.byId
    let rangesAllIds = state.ranges.allIds

    switch (action.type) {
        case ADD_GRAPH: {
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
            let catIds = new Set(graph.categories)
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
        case ADD_CATEGORY: {
            let category = action.payload.catData.category
            let ids = state.categories.allIds
            let catId = ids.length ? ids[ids.length - 1] + 1 : 0
            let newCatsById = { ...catById, catId: catData }
            let newCatsAllIds = [...catsAllIds, catId]
            let newGraphCategories = [...graph.categories, catId]

            return {
                ...state,
                categories: {
                    ...state.categories,
                    byId: newCatsById,
                    allIds: newCatsAllIds,
                },
                graphs: {
                    ...state.graphs,
                    byId: {
                        ...state.graphs.byId,
                        graphId: { ...graph, categories: newGraphCategories },
                    },
                },
            }
        }
        case REMOVE_CATEGORY: {
            let remId = -1

            for (let [key, value] of Object.entries(catById)) {
                if (value.category === action.payload.category) {
                    remId = key
                    break
                }
            }
            if (remId === -1) {
                return
            }

            let newCatsById = removeKeys({ ...catById }, new Set([remId]))
            let newCatsAllIds = catsAllIds.filter(x => x !== remId)
            let newGraphCategories = graph.categories.filter(x => x !== remId)
            return {
                ...state,
                graphs: {
                    ...state.graphs,
                    byId: {
                        ...graphById,
                        [graphId]: { ...graph, categories: newGraphCategories },
                    },
                },
                categories: {
                    ...state.categories,
                    byId: newCatsById,
                    allIds: newCatsAllIds,
                },
            }
        }
        default: {
            return state
        }
    }
}

export default appReducer
