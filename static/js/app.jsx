import React, { Component } from "react"
import SideControls from "./components/SideControls"
import GraphTile from "./components/GraphTile"
import ConfigTab from "./components/ConfigTab"
import DockLayout from "rc-dock"

let openDocks = 1

let groups = {
    "close-all": {
        floatable: false,
        closable: true,
        tabLocked: true,
        panelExtra: (panelData, context) => (
            <div>
                <span
                    className="panel-ctrl"
                    onClick={() =>
                        context.dockMove(panelData, null, "maximize")
                    }
                >
                    {panelData.parent.mode === "maximize" ? "🗕" : "🗖"}
                </span>
                <span
                    className="panel-ctrl"
                    onClick={() => context.dockMove(panelData, null, "remove")}
                >
                    🗙
                </span>
            </div>
        ),
    },
    "close-all2": {
        floatable: false,
        closable: true,
        tabLocked: true,
        panelExtra: (panelData, context) => (
            <div>
                <span
                    className="panel-ctrl"
                    onClick={() =>
                        context.dockMove(panelData, null, "maximize")
                    }
                >
                    {panelData.parent.mode === "maximize" ? "🗕" : "🗖"}
                </span>
                <span
                    className="panel-ctrl"
                    onClick={() => {
                        if (openDocks > 1) {
                            openDocks--
                            context.dockMove(panelData, null, "remove")
                        }
                    }}
                >
                    🗙
                </span>
            </div>
        ),
    },
}

const defaultLayout = {
    dockbox: {
        mode: "horizontal",
        children: [
            {
                mode: "horizontal",
                tabs: [
                    {
                        id: "graph1",
                        title: "Graph 1",
                        group: "close-all",
                        content: <GraphTile />,
                    },
                    {
                        id: "cfg1",
                        title: "Config 1",
                        group: "close-all",
                        content: <ConfigTab />,
                    },
                ],
            },
            {
                mode: "horizontal",
                tabs: [
                    {
                        id: "graph2",
                        title: "Graph 2",
                        group: "close-all2",
                        content: <GraphTile />,
                    },
                    {
                        id: "cfg2",
                        title: "Config 2",
                        group: "close-all2",
                        content: <ConfigTab />,
                    },
                ],
            },
        ],
    },
}

const docStyle = {
    position: "absolute",
    left: 20,
    top: 0,
    right: 0,
    bottom: 0,
}

class App extends Component {
    constructor(props) {
        super(props)

        this.state = {
            ws: null,
            serverData: {},
        }

        this.addGraphTile = this.addGraphTile.bind(this)
    }

    setupWebsocket() {
        this.state.ws = new WebSocket("ws://192.168.2.111:7123/ws")
        let ws = this.state.ws

        ws.onopen = evt => {
            console.log("Websocket connected")
            let cmd = {
                add_categories: {
                    PCBandwidth: {
                        start: "2019-10-22 00:00 -0600",
                        end: "2019-10-22 23:59 -0600",
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
            setTimeout(() => this.setupWebsocket(), 1000)
        }

        this.state.ws.error = evt => {
            console.log("Websocket error: ", evt)
            ws.close()
        }
    }

    addGraphTile() {
        console.log("Adding graph tile!")
    }

    componentDidMount() {
        this.setupWebsocket()
    }

    render() {
        return (
            <div>
                <SideControls addGraphTile={this.addGraphTile}/>
                <DockLayout
                    defaultLayout={defaultLayout}
                    dropMode="edge"
                    groups={groups}
                    style={docStyle}
                />
            </div>
        )
    }
}

export default App
