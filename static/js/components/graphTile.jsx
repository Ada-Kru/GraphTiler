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
        let node = props.node
        let cfg = node.getConfig()
        let id = cfg.graphId
        let cats = props.graphs[id] ? props.graphs[id].categories : {}

        this.state = {
            graphId: id,
            configPanelOpen: cfg.configPanelOpen,
            categories: cats,
        }

        this.props.listener(cfg.graphId, {
            registerGraph: true,
        })

        node.setEventListener("configPanelOpen", () => {
            this.setState(prevState => {
                return {
                    configPanelOpen: !prevState.configPanelOpen,
                }
            })
        })

        node.setEventListener("close", () => {
            this.props.listener(cfg.graphId, { removeGraph: true })
        })
    }

    showConfig = () => {
        console.log("showConfig")
    }

    componentDidUpdate = (prevProps) => {
        let id = this.state.graphId
        let cats = prevProps.graphs[id] ? prevProps.graphs[id].categories : {}
        if (cats != this.state.categories) {
            this.setState({categories: cats})
        }
    }

    render() {
        let state = this.state
        let props = this.props
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
                        graphId={state.graphId}
                        listener={props.listener}
                        availableCats={props.availableCats}
                        categories={state.categories}
                    />
                </div>
            )
        }
    }
}

export default GraphTile
