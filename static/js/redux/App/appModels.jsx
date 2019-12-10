import { Model, many, fk, oneToOne, Schema } from "redux-orm"
import {
    ADD_GRAPH,
    REMOVE_GRAPH,
    ADD_CATEGORY,
    REMOVE_CATEGORY,
    MODIFY_RANGE,
} from "./appTypes"

export class Graph extends Model {
    static reducer(state, action, Graph, session) {
        const { type, payload } = action
        switch (type) {
            case ADD_GRAPH: {
                Graph.create(payload)
                break
            }
        }
    }
}
Graph.modelName = "Graph"
Graph.fields = {
    range: oneToOne("Range", "Graphs"),
    categories: many("Category", "Graphs"),
}
Graph.backend = {
    idAttribute: "graphId"
}

export class Range extends Model {
    static reducer(state, action, Range, session) {
        const { type, payload } = action
        switch (type) {
            case ADD_GRAPH: {

                break
            }
        }
    }
}
Range.modelName = "Range"

export class Category extends Model {}
Category.modelName = "Category"


export const schema = new Schema();
schema.register(Graph, Range, Category);

export default schema;
