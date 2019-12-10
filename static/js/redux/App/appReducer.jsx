import {
    ADD_GRAPH,
    REMOVE_GRAPH,
    ADD_CATEGORY,
    REMOVE_CATEGORY,
    MODIFY_RANGE,
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
    console.log("reducer called: ", action)
    console.log("state:", state)
    let type = action.type
    if (!action.hasOwnProperty("payload")) {
        return state
    }
    if (
        type === REMOVE_GRAPH ||
        type === ADD_CATEGORY ||
        type === REMOVE_CATEGORY ||
        type === MODIFY_RANGE
    ) {
        if (!state.graphs.byId.hasOwnProperty(action.payload.graphId)) {
            return state
        }
    }

    let graphId = action.payload.graphId
    let graph = state.graphs.byId[graphId]
    let catsById = state.categories.byId
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
            let newCatsById = removeKeys({ ...catsById }, catIds)
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
                    byId: { ...catsById, ...newCatsById },
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
            let graphCats = graph.categories
            let ids = state.categories.allIds
            let catId = ids.length ? ids[ids.length - 1] + 1 : 0

            let newCatsById = { ...catsById, [catId]: action.payload.catData }
            let newCatsAllIds = [...catsAllIds, catId]
            let newGraphCats = [...graphCats, catId]

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
                        [graphId]: { ...graph, categories: newGraphCats },
                    },
                },
            }
        }
        case REMOVE_CATEGORY: {
            let remId = -1

            for (let [key, value] of Object.entries(catsById)) {
                if (value.category === action.payload.category) {
                    remId = key
                    break
                }
            }
            if (remId === -1) {
                return state
            }

            let remIdInt = parseInt(remId)
            let newCatsById = removeKeys({ ...catsById }, new Set([remId]))
            let newCatsAllIds = catsAllIds.filter(x => x !== remIdInt)
            let newGraphCats = graph.categories.filter(x => x !== remIdInt)
            return {
                ...state,
                graphs: {
                    ...state.graphs,
                    byId: {
                        ...graphById,
                        [graphId]: { ...graph, categories: newGraphCats },
                    },
                },
                categories: {
                    ...state.categories,
                    byId: newCatsById,
                    allIds: newCatsAllIds,
                },
            }
        }
        case MODIFY_RANGE: {
            let rangeId = graph.range
            let newRangesById = { ...rangesById, [rangeId]: action.payload.rangeData.range }
            return {
                ...state,
                ranges: {
                    ...state.ranges,
                    byId: newRangesById,
                },
            }
        }
        default: {
            return state
        }
    }
}

export default appReducer
