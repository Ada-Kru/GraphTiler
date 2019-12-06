import React, { Component } from "react"
import { Line, Bar, Radar, Polar } from "react-chartjs-2"
import GraphConfigPanel from "./GraphConfigPanel"
import moment from "moment"

const data = {
    datasets: [
        {
            fill: true,
            label: "Test Data",
            lineTension: 0,
            backgroundColor: "#444",
            borderColor: "#0F0",
            pointStyle: "rectRounded",
            pointBackgroundColor: "#0F0",
            pointHoverBackgroundColor: "#888",
            pointHoverBorderColor: "#999",
            pointHoverBorderWidth: 2,
            data: [
                { x: "2019-12-05 10:15", y: 65 },
                { x: "2019-12-05 10:30", y: 59 },
                { x: "2019-12-05 10:45", y: 80 },
                { x: "2019-12-05 11:00", y: 81 },
                { x: "2019-12-05 11:15", y: 56 },
                { x: "2019-12-05 11:30", y: 55 },
                { x: "2019-12-05 11:45", y: 40 },
                { x: "2019-12-05 12:00", y: 56 },
            ],
        },
    ],
}

const options = {
    responsive: true,
    maintainAspectRatio: false,
    legend: {
        display: false,
    },
    scales: {
        xAxes: [
            {
                type: "time",
                distribution: "linear",
                bounds: "ticks",
                time: {
                    displayFormats: {
                        hour: "hA MMM D",
                        minute: "HH:mm"
                    },
                    labelString: "Date",
                    parser: "YYYY-MM-DD HH:mm",
                },
                ticks: {
                    source: "data",
                },
            },
        ],
        yAxes: [
            {
                ticks: {
                    beginAtZero: true,
                },
                scaleLabel: {
                    labelString: "Test data",
                },
            },
        ],
    },
}

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

    componentDidUpdate = prevProps => {
        let id = this.state.graphId
        let cats = prevProps.graphs[id] ? prevProps.graphs[id].categories : {}
        if (cats != this.state.categories) {
            this.setState({ categories: cats })
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
                        graphs={props.graphs}
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
