import React, { Component } from "react"
import SideControls from "./components/SideControls"
import GraphTile from "./components/GraphTile"
import ConfigTab from "./components/ConfigTab"
import DockLayout from "rc-dock"

const hiddenTab = num => {
    return {
        id: `hiddenTab${num}`,
        title: "Hidden",
        group: "close-all",
        closable: false,
        content: <div />,
    }
}

let groups = {
    "close-all": {
        floatable: false,
        closable: true,
        // panelExtra: (panelData, context) => (
        //     <div>
        //         <span
        //             className="panel-ctrl"
        //             onClick={() =>
        //                 context.dockMove(panelData, null, "maximize")
        //             }
        //         >
        //             {panelData.parent.mode === "maximize" ? "🗕" : "🗖"}
        //         </span>
        //         <span
        //             className="panel-ctrl"
        //             onClick={() => context.dockMove(panelData, null, "remove")}
        //         >
        //             🗙
        //         </span>
        //     </div>
        // ),
    },
}

const defaultLayout = {
    dockbox: {
        id: "baseBox",
        mode: "horizontal",
        size: 0,
        children: [
            {
                id: "mainPanel",
                tabs: [
                    {
                        id: "initialTab",
                        title: "initial",
                        closable: true,
                        content: <div />,
                    },
                ],
                // panelLock: {},
                // group: "close-all",
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
            wsState: "disconnected",
            serverData: {},
        }

        this.numGraphs = 0

        // this.addGraphTile = this.addGraphTile.bind(this)
    }

    getRef = ref => {
        this.dockLayout = ref
        this.mainPanel = this.dockLayout.find("mainPanel")
    }

    setupWebsocket = () => {
        this.state.ws = new WebSocket("ws://192.168.2.111:7123/ws")
        this.setState({ wsState: "connecting" })
        let ws = this.state.ws

        ws.onopen = evt => {
            console.log("Websocket connected")
            this.setState({ wsState: "connected" })
            // let cmd = {
            //     add_categories: {
            //         PCBandwidth: {
            //             start: "2019-10-22 00:00 -0600",
            //             end: "2019-10-22 23:59 -0600",
            //         },
            //     },
            // }
            // ws.send(JSON.stringify(cmd))
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

    addGraphTile = () => {
        this.numGraphs++
        let graphNum = this.numGraphs
        let newPanel = {
            id: `panel${graphNum}`,
            mode: "horizontal",
            tabs: [
                {
                    id: `graphTab${graphNum}`,
                    title: `Graph ${graphNum}`,
                    closable: true,
                    content: <GraphTile />,
                },
            ],
        }

        this.dockLayout.dockMove(newPanel, "mainPanel", "middle")
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
                <DockLayout
                    ref={this.getRef}
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
