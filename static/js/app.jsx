import React, { Component } from "react"
import SideControls from "./components/SideControls"
import GraphTile from "./components/GraphTile"
import FlexLayout from "flexlayout-react"
import uuid from "uuid/v4"
import moment from "moment"

const BACKEND_DATE_FORMAT = "YYYY-MM-DD HH:mm ZZ"

var layout = {
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
        output.since = moment(rangeData.since).format(BACKEND_DATE_FORMAT)
    } else if (rangeData.hasOwnProperty("start")) {
        output.start = moment(rangeData.start).format(BACKEND_DATE_FORMAT)
        output.end = moment(rangeData.end).format(BACKEND_DATE_FORMAT)
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
            serverData: {},
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
    }

    setupWebsocket = () => {
        this.ws = new WebSocket("ws://192.168.2.111:7123/ws")
        this.setState({ wsState: "connecting" })

        this.ws.onopen = evt => {
            console.log("Websocket connected")
            this.setState({ wsState: "connected" })
        }

        this.ws.onmessage = evt => {
            let data = JSON.parse(evt.data)
            this.setState({ serverData: data })
            console.log(data)
        }

        this.ws.onclose = () => {
            console.log("Websocket connection closed.")
            this.setState({ wsState: "disconnected" })
            setTimeout(() => this.setupWebsocket(), 1000)
        }

        this.ws.error = evt => {
            console.log("Websocket error: ", evt)
            this.ws.close()
        }
    }

    listener = (graphId, msg) => {
        // console.log("listener", graphId, msg)
        if (msg.hasOwnProperty("registerGraph")) {
            let newGraphs = { ...this.state.graphs }
            newGraphs[graphId] = {
                categories: {},
                range: { rangeType: "past", pastAmount: 1, pastUnit: "hr" },
            }
            this.setState({ graphs: newGraphs })
        }

        if (msg.hasOwnProperty("removeGraph")) {
            let newGraphs = { ...this.state.graphs }
            let catData = newGraphs[graphId].categories
            delete newGraphs[graphId]
            this.setState({ graphs: newGraphs })

            let cmd = {
                remove_categories: {
                    unique_id: graphId,
                    categories: Object.keys(catData),
                },
            }
            this.ws.send(JSON.stringify(cmd))
        }

        if (msg.hasOwnProperty("addCategory")) {
            let data = msg.addCategory
            let newGraphs = { ...this.state.graphs }
            if (newGraphs[graphId].categories[data.category]) {
                delete newGraphs[graphId].categories[data.category]
            }
            newGraphs[graphId].categories[data.category] = {
                lineColor: data.lineColor,
            }
            this.setState({ graphs: newGraphs })

            let cmd = {
                add_categories: {
                    unique_id: graphId,
                    range: formatWsRangeData(newGraphs[graphId].range),
                    categories: [data.category],
                },
            }
            this.ws.send(JSON.stringify(cmd))
        }

        if (msg.hasOwnProperty("removeCategory")) {
            let data = msg.removeCategory
            let newGraphs = { ...this.state.graphs }
            delete newGraphs[graphId].categories[data.category]
            this.setState({ graphs: newGraphs })

            let cmd = {
                remove_categories: {
                    unique_id: graphId,
                    categories: [data.category],
                },
            }
            this.ws.send(JSON.stringify(cmd))
        }

        if (msg.hasOwnProperty("modifyGraphRange")) {
            let newGraphs = { ...this.state.graphs }
            let rangeData = msg.modifyGraphRange
            newGraphs[graphId] = { ...newGraphs[graphId], ...rangeData }
            this.setState({ graphs: newGraphs })

            let catData = newGraphs[graphId].categories
            let cmd = {
                add_categories: {
                    unique_id: graphId,
                    range: formatWsRangeData(rangeData.range),
                    categories: Object.keys(catData),
                },
            }
            this.ws.send(JSON.stringify(cmd))
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
            () => {
                console.log("graphs: ", this.state.graphs)
            }
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

export default App
