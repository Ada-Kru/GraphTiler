import React, { Component } from "react"
import { connect } from "react-redux"
import SideControls from "./components/SideControls"
import GraphTile from "./components/GraphTile"
import FlexLayout from "flexlayout-react"
import removeKeys from "./components/removeKeys"
import insertPoints from "./components/insertPoints"
import { addGraph, removeGraph } from "./redux"
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
            graphs: {},
            graphData: {},
        }

        this.ws = null
        this.numGraphs = 0
        this.availableCats = [
            {
                name: "PCBandwidth",
                displayName: "Bandwidth",
                units: "Bytes",
                abrvUnit: "b",
                decimalPlaces: 0,
            },
        ]

        this._wsMsgMap = {
            point_update: this.onMsgPointUpdate,
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
        }

        this.ws.onmessage = evt => {
            let msg = JSON.parse(evt.data)
            console.log("websocket data:", msg)
            for (let [type, data] of Object.entries(msg)) {
                this._wsMsgMap[type](data)
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

    listener = (graphId, msg) => {
        for (let [key, data] of Object.entries(msg)) {
            this._listenerMap[key](graphId, data)
        }
    }

    _cloneGraphs = () => {
        return [{ ...this.state.graphs }, { ...this.state.graphData }]
    }

    onRegisterGraph = (graphId, data) => {
        this.props.addGraph(graphId)
        let [newGraphs, newGraphData] = this._cloneGraphs()
        newGraphs[graphId] = {
            categories: {},
            range: { rangeType: "past", pastAmount: 1, pastUnit: "hr" },
        }
        newGraphData[graphId] = { categories: {} }
        this.setState({ graphs: newGraphs, graphData: newGraphData })
    }

    onRemoveGraph = (graphId, data) => {
        this.props.removeGraph(graphId)
        let [newGraphs, newGraphData] = this._cloneGraphs()
        let catData = newGraphs[graphId].categories
        delete newGraphs[graphId]
        delete newGraphData[graphId]
        this.setState({ graphs: newGraphs, graphData: newGraphData })

        let cmd = {
            remove_categories: [
                { unique_id: graphId, categories: Object.keys(catData) },
            ],
        }
        this.ws.send(JSON.stringify(cmd))
    }

    onAddCategory = (graphId, catCfg) => {
        let [newGraphs, newGraphData] = this._cloneGraphs()
        newGraphs[graphId].categories[catCfg.category] = catCfg
        newGraphData[graphId].categories[catCfg.category] = []
        this.setState({ graphs: newGraphs, graphData: newGraphData })

        let cmd = {
            add_categories: [
                {
                    unique_id: graphId,
                    range: formatWsRangeData(newGraphs[graphId].range),
                    categories: [catCfg.category],
                },
            ],
        }
        this.ws.send(JSON.stringify(cmd))
    }

    onRemoveCategory = (graphId, data) => {
        let [newGraphs, newGraphData] = this._cloneGraphs()
        delete newGraphs[graphId].categories[data.category]
        delete newGraphData[graphId].categories[data.category]
        this.setState({ graphs: newGraphs, graphData: newGraphData })

        let cmd = {
            remove_categories: [
                { unique_id: graphId, categories: [data.category] },
            ],
        }
        this.ws.send(JSON.stringify(cmd))
    }

    onModifyGraphRange = (graphId, rangeData) => {
        let [newGraphs, newGraphData] = this._cloneGraphs()
        newGraphs[graphId] = { ...newGraphs[graphId], ...rangeData }
        let categories = Object.keys(newGraphData[graphId].categories)
        for (let category of categories) {
            newGraphData[graphId].categories[category].length = 0
        }
        this.setState({ graphs: newGraphs })

        let cmd = {
            add_categories: [
                {
                    unique_id: graphId,
                    range: formatWsRangeData(rangeData.range),
                    categories: categories,
                },
            ],
        }
        this.ws.send(JSON.stringify(cmd))
    }

    onMsgPointUpdate = categories => {
        let newGraphData = { ...this.state.graphData }
        for (let [category, readings] of Object.entries(categories)) {
            let points = []
            for (let [timeStr, reading] of Object.entries(readings)) {
                points.push({
                    x: moment.utc(timeStr, RECV_DATE_FORMAT),
                    y: reading,
                })
            }
            this.updateGraphPoints(newGraphData, category, points)
        }
        console.log("graphdata", newGraphData)
        this.setState({ graphData: newGraphData })
    }

    updateGraphPoints = (graphData, category, points) => {
        for (let graphId of Object.keys(graphData)) {
            let graphCats = graphData[graphId].categories
            if (graphCats.hasOwnProperty(category)) {
                let catData = graphCats[category]
                insertPoints(catData, points)
            }
        }
    }

    factory = node => {
        switch (node.getComponent()) {
            case "graphTile":
                return (
                    <GraphTile
                        node={node}
                        listener={this.listener}
                        availableCats={this.availableCats}
                        graphs={this.state.graphs}
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
            // () => {
            //     console.log("graphs: ", this.state.graphs)
            // }
        )
    }

    configButtonClicked = cfg => {
        console.log("from click", cfg)
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
                    {this.availableCats.map((item, idx) => {
                        return (
                            <option key={item.name} value={item.name}>
                                {item.name}
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
                        factory={this.factory}
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
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(App)
