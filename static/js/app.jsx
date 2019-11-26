import React, { Component } from "react"
import SideControls from "./components/SideControls"
import GraphTile from "./components/GraphTile"
import FlexLayout from "flexlayout-react"

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
                        config: { configPanelOpen: true },
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

    factory = node => {
        switch (node.getComponent()) {
            case "graphTile":
                return <GraphTile node={node} />
                break
        }
    }

    addGraphTile = () => {
        if (document.getElementsByClassName("flexlayout__drag_rect").length) {
            return
        }
        this.numGraphs++
        this.refs.layout.addTabWithDragAndDropIndirect(
            "Add graph<br>(Drag to location)",
            {
                component: "graphTile",
                name: `Graph ${this.numGraphs}`,
                config: { configPanelOpen: false },
            },
            null
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
