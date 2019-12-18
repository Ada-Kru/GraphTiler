import React, { Component } from "react"
import { connect } from "react-redux"
import SideControls from "./components/SideControls"
import GraphTile from "./components/GraphTile"
import FlexLayout from "flexlayout-react"
import removeKeys from "./components/removeKeys"
import insertPoints from "./components/insertPoints"
import {
    addGraph,
    removeGraph,
    addCategory,
    removeCategory,
    modifyRange,
    newDataPoints,
    removeDataPoints,
} from "./redux"
import uuid from "uuid/v4"
import moment from "moment"

const RECV_DATE_FORMAT = "YYYY-MM-DD HH:mm:ss"
const SEND_DATE_FORMAT = RECV_DATE_FORMAT + " ZZ"

let layout = {
    global: { splitterSize: 5, tabDragSpeed: 0.15 },
    layout: {
        type: "row",
        weight: 100,
        children: [
            {
                type: "tabset",
                weight: 50,
                selected: 0,
                children: [
                    {
                        component: "graphTile",
                        name: "TEST",
                        config: { graphId: "test", configPanelOpen: true },
                    },
                ],
            },
        ],
    },
}

function formatWsRangeData(rangeData) {
    let output = { range_type: rangeData.rangeType }
    if (rangeData.hasOwnProperty("pastUnit")) {
        output.past_unit = rangeData.pastUnit
        output.past_amount = rangeData.pastAmount
    } else if (rangeData.hasOwnProperty("since")) {
        output.since = moment.utc(rangeData.since).format(SEND_DATE_FORMAT)
    } else if (rangeData.hasOwnProperty("start")) {
        output.start = moment.utc(rangeData.start).format(SEND_DATE_FORMAT)
        output.end = moment.utc(rangeData.end).format(SEND_DATE_FORMAT)
    }

    return output
}

class App extends Component {
    constructor(props) {
        super(props)

        this.state = {
            model: FlexLayout.Model.fromJson(layout),
            wsState: "disconnected",
            availableCats: {},
        }

        this.ws = null
        this.numGraphs = 0
        this._wsMsgMap = {
            point_update: this.onMsgPointUpdate,
            category_added: this.onAddedBackendCat,
            category_removed: this.onRemovedBackendCat,
            removed_points: this.onBackendRemovedPoints,
        }
        this._listenerMap = {
            registerGraph: this.onRegisterGraph,
            removeGraph: this.onRemoveGraph,
            addCategory: this.onAddCategory,
            removeCategory: this.onRemoveCategory,
            modifyGraphRange: this.onModifyGraphRange,
        }
    }

    setupWebsocket = () => {
        this.ws = new WebSocket("ws://192.168.2.111:7123/ws")
        this.setState({ wsState: "connecting" })

        this.ws.onopen = evt => {
            this.setState({ wsState: "connected" })
            let catData = []
            for (let graphId of Object.keys(this.props.graphs)) {
                catData.push({
                    unique_id: graphId,
                    range: formatWsRangeData(this._getGraphRange(graphId)),
                    categories: this._getGraphCatNames(graphId),
                })
            }

            this._send({ add_categories: catData })
        }

        this.ws.onmessage = evt => {
            let msg = JSON.parse(evt.data)
            console.log("websocket data:", msg)
            for (let [type, data] of Object.entries(msg)) {
                if (this._wsMsgMap.hasOwnProperty(type)) {
                    this._wsMsgMap[type](data)
                }
            }
        }

        this.ws.onclose = () => {
            this.setState({ wsState: "disconnected" })
            setTimeout(() => this.setupWebsocket(), 1000)
        }

        this.ws.error = evt => {
            console.log("Websocket error: ", evt)
            this.ws.close()
        }
    }

    _send = data => {
        this.ws.send(JSON.stringify(data))
    }

    listener = (graphId, msg) => {
        for (let [key, data] of Object.entries(msg)) {
            this._listenerMap[key](graphId, data)
        }
    }

    _getGraphCatNames = graphId => {
        let cats = []
        for (let catId of this.props.graphs[graphId].categories) {
            cats.push(this.props.categories[catId].category)
        }
        return cats
    }

    _getGraphRange = graphId => {
        return this.props.ranges[this.props.graphs[graphId].range]
    }

    onRegisterGraph = (graphId, data) => {
        this.props.addGraph(graphId)
    }

    onRemoveGraph = (graphId, data) => {
        this.props.removeGraph(graphId)

        this._send({
            remove_categories: [
                {
                    unique_id: graphId,
                    categories: this._getGraphCatNames(graphId),
                },
            ],
        })
    }

    onAddCategory = (graphId, catCfg) => {
        this.props.addCategory(graphId, catCfg)

        this._send({
            add_categories: [
                {
                    unique_id: graphId,
                    range: formatWsRangeData(this._getGraphRange(graphId)),
                    categories: [catCfg.category],
                },
            ],
        })
    }

    onRemoveCategory = (graphId, data) => {
        this.props.removeCategory(graphId, data.category)

        this._send({
            remove_categories: [
                { unique_id: graphId, categories: [data.category] },
            ],
        })
    }

    onModifyGraphRange = (graphId, rangeData) => {
        this.props.modifyRange(graphId, rangeData)

        this._send({
            add_categories: [
                {
                    unique_id: graphId,
                    range: formatWsRangeData(rangeData.range),
                    categories: this._getGraphCatNames(graphId),
                },
            ],
        })
    }

    onMsgPointUpdate = categories => {
        let newCatPoints = {}
        for (let [category, readings] of Object.entries(categories)) {
            let points = []
            for (let [timeStr, reading] of Object.entries(readings)) {
                points.push({
                    x: moment.utc(timeStr, RECV_DATE_FORMAT),
                    y: reading,
                })
            }
            newCatPoints[category] = points
        }
        this.props.newDataPoints(newCatPoints)
    }

    onAddedBackendCat = newCats => {
        let newCatState = { ...this.state.availableCats }
        for (let catData of newCats) {
            newCatState[catData.name] = catData
        }
        this.setState({ availableCats: newCatState })
    }

    onRemovedBackendCat = removed => {
        let newCatState = { ...this.state.availableCats },
            rem = {}
        for (let catName of removed) {
            delete newCatState[catName]
            rem[catName] = { all: true }
        }
        this.setState({ availableCats: newCatState })
        this.props.removeDataPoints(rem)
    }

    onBackendRemovedPoints = remData => {
        for (let range of Object.values(remData)) {
            if (range.hasOwnProperty("times")) {
                range.times.forEach((x, idx, arr) => {
                    arr[idx] = moment.utc(x, RECV_DATE_FORMAT)
                })
            }
            if (range.hasOwnProperty("since")) {
                range.since = moment.utc(range.since, RECV_DATE_FORMAT)
            }
            if (range.hasOwnProperty("range")) {
                let start = range.range.start,
                    end = range.range.end
                range.range.start = moment.utc(start, RECV_DATE_FORMAT)
                range.range.end = moment.utc(end, RECV_DATE_FORMAT)
            }
        }
        this.props.removeDataPoints(remData)
    }

    _factory = node => {
        switch (node.getComponent()) {
            case "graphTile":
                return (
                    <GraphTile
                        node={node}
                        listener={this.listener}
                        availableCats={this.availableCats}
                    />
                )
                break
        }
    }

    addGraphTile = () => {
        if (document.getElementsByClassName("flexlayout__drag_rect").length) {
            return
        }
        this.numGraphs++
        this.refs.layout.addTabWithDragAndDropIndirect(
            "Drag to location to add a graph<br>ESC to cancel",
            {
                component: "graphTile",
                name: `Graph ${this.numGraphs}`,
                config: {
                    graphId: uuid(),
                    configPanelOpen: true,
                },
            },
            null
        )
    }

    customizeTab = (node, data) => {
        data.content = (
            <span
                className="flexlayout__tab_button_content"
                title="Double click to change title"
            >
                {data.content}
                <span
                    className="graphConfigButton"
                    title="Configure graph"
                    onMouseDown={evt => {
                        evt.preventDefault()
                        node._fireEvent("configPanelOpen")
                    }}
                >
                    ⛭
                </span>
            </span>
        )
    }

    componentDidMount() {
        this.setupWebsocket()
    }

    render() {
        return (
            <div>
                <datalist id="AvailableCats">
                    {Object.keys(this.state.availableCats).map(key => {
                        return (
                            <option key={key} value={key}>
                                {key}
                            </option>
                        )
                    })}
                </datalist>
                <SideControls
                    addGraphTile={this.addGraphTile}
                    wsState={this.state.wsState}
                />
                <div className="graphGrid">
                    <FlexLayout.Layout
                        model={this.state.model}
                        factory={this._factory}
                        ref="layout"
                        onRenderTab={this.customizeTab}
                    />
                </div>
            </div>
        )
    }
}

const mapStateToProps = state => {
    return {
        graphs: state.graphs,
        ranges: state.ranges,
        categories: state.categories,
    }
}

const mapDispatchToProps = dispatch => {
    return {
        addGraph: graphId => dispatch(addGraph(graphId)),
        removeGraph: graphId => dispatch(removeGraph(graphId)),
        addCategory: (graphId, catData) =>
            dispatch(addCategory(graphId, catData)),
        removeCategory: (graphId, category) =>
            dispatch(removeCategory(graphId, category)),
        modifyRange: (graphId, rangeData) =>
            dispatch(modifyRange(graphId, rangeData)),
        newDataPoints: data => dispatch(newDataPoints(data)),
        removeDataPoints: ranges => dispatch(removeDataPoints(ranges)),
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(App)
