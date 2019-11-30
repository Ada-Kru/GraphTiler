import React, { Component } from "react"
import SideControls from "./components/SideControls"
import GraphTile from "./components/GraphTile"
import FlexLayout from "flexlayout-react"
import uuid from "uuid/v4";

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
                        name: `TEST`,
                        config: { graphId: "test", configPanelOpen: true },
                    },
                ],
            },
        ],
    },
}

class App extends Component {
    constructor(props) {
        super(props)

        this.state = {
            model: FlexLayout.Model.fromJson(layout),
            ws: null,
            wsState: "disconnected",
            serverData: {},
        }

        this.numGraphs = 0
        this.graphs = {}
        this.monitoredCats = {}
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
        this.state.ws = new WebSocket("ws://192.168.2.111:7123/ws")
        this.setState({ wsState: "connecting" })
        let ws = this.state.ws

        ws.onopen = evt => {
            console.log("Websocket connected")
            this.setState({ wsState: "connected" })
            let cmd = {
                add_categories: {
                    PCBandwidth: {
                        UniqueKey: {
                            start: "2019-10-22 00:00 -0600",
                            end: "2019-10-22 23:59 -0600",
                        },
                    },
                },
            }
            ws.send(JSON.stringify(cmd))
        }

        ws.onmessage = evt => {
            let data = JSON.parse(evt.data)
            this.setState({ serverData: data })
            console.log(data)
        }

        ws.onclose = () => {
            console.log("Websocket connection closed.")
            this.setState({ wsState: "disconnected" })
            setTimeout(() => this.setupWebsocket(), 1000)
        }

        this.state.ws.error = evt => {
            console.log("Websocket error: ", evt)
            ws.close()
        }
    }

    listener = (graphId, changed) => {
        console.log("listener", graphId, changed)
        if (changed.hasOwnProperty("registerGraph")) {
            this.graphs[graphId] = { categories: {} }
        }
        if (changed.hasOwnProperty("removeGraph")) {
            delete this.graphs[graphId]
        }
        if (changed.hasOwnProperty("addCategory")) {
            let data = changed.addCategory
            if (!this.monitoredCats.hasOwnProperty(data.category)) {
                this.monitoredCats[data.category] = {}
            }
            this.monitoredCats[data.category][data.rangeId] = data.rangeData
        }
        if (changed.hasOwnProperty("removeCategory")) {
            let data = changed.removeCategory
            delete this.monitoredCats[data.category][data.rangeId]
            let cat = this.monitoredCats[data.category]
            if (
                Object.entries(cat).length === 0 &&
                cat.constructor === Object
            ) {
                delete this.monitoredCats[data.category]
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
                        availableCats={this.state.availableCats}
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
                console.log(this.graphs)
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
