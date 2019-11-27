import React, { Component } from "react"
import { Line } from "react-chartjs-2"
import GraphConfigPanel from "./GraphConfigPanel"

const data = {
    labels: ["1", "2", "3", "4", "5", "6", "7"],
    datasets: [
        {
            label: "Test Data",
            fill: true,
            lineTension: 0,
            backgroundColor: "#555",
            borderColor: "#0C0",
            borderCapStyle: "butt",
            borderDash: [],
            borderDashOffset: 0.0,
            borderJoinStyle: "miter",
            maintainAspectRatio: false,
            pointBorderColor: "#0F0",
            pointBackgroundColor: "#FFFFFF",
            pointBorderWidth: 1,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: "rgba(75,192,192,1)",
            pointHoverBorderColor: "rgba(220,220,220,1)",
            pointHoverBorderWidth: 2,
            pointRadius: 1,
            pointHitRadius: 10,
            responsive: true,
            data: [65, 59, 80, 81, 56, 55, 40],
        },
    ],
}

const options = { responsive: true, maintainAspectRatio: false }

class GraphTile extends Component {
    constructor(props) {
        super(props)
        let node = this.props.node
        let cfg = node.getConfig()

        this.state = {
            graphId: cfg.graphId,
            configPanelOpen: cfg.configPanelOpen,
        }

        node.setEventListener("configPanelOpen", () => {
            this.setState(prevState => {
                return {
                    configPanelOpen: !prevState.configPanelOpen,
                }
            })
        })
    }

    showConfig = () => {
        console.log("showConfig")
    }

    render() {
        if (!this.state.configPanelOpen) {
            return (
                <div className="graphTile">
                    <div className="graphHolder">
                        <Line data={data} options={options} />
                    </div>
                </div>
            )
        } else {
            return (
                <div className="graphTile">
                    <div className="graphHolder configOpen">
                        <Line data={data} options={options} />
                    </div>
                    <GraphConfigPanel
                        graphId={this.state.graphId}
                        onModifySettings={this.props.onModifySettings}
                    />
                </div>
            )
        }
    }
}

export default GraphTile
