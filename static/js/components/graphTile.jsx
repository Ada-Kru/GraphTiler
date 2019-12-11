import React, { Component } from "react"
import { connect } from "react-redux"
import { Line, Bar, Radar, Polar } from "react-chartjs-2"
import GraphConfigPanel from "./GraphConfigPanel"
import insertPoints from "./insertPoints"
import removeKeys from "./removeKeys"
import moment from "moment"

const arrEqual = (a, b) => {
    if (a === b) return true
    if (a == null || b == null) return false
    if (a.length != b.length) return false

    for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false
    }
    return true
}

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
                        minute: "HH:mm",
                    },
                    labelString: "Date",
                    parser: "YYYY-MM-DD HH:mm:ss",
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
        let cfg = props.node.getConfig()
        let catIds = props.graphs.hasOwnProperty(cfg.graphId)
            ? props.graphs[cfg.graphId].categories
            : []

        this.state = { configPanelOpen: cfg.configPanelOpen, catIds: catIds }
        this.graphId = cfg.graphId
        this.catData = {}

        props.listener(cfg.graphId, { registerGraph: true })
        props.node.setEventListener("configPanelOpen", () => {
            this.setState(prevState => {
                return { configPanelOpen: !prevState.configPanelOpen }
            })
        })

        props.node.setEventListener("close", () => {
            this.props.listener(cfg.graphId, { removeGraph: true })
        })
    }

    componentDidUpdate = prevProps => {
        let props = this.props,
            state = this.state,
            id = this.graphId,
            catIds = props.graphs.hasOwnProperty(this.graphId)
                ? props.graphs[this.graphId].categories
                : []
        if (!arrEqual(catIds, state.categories)) {
            let catNames = this._getGraphCatNames(catIds),
                currentCats = new Set(catNames),
                newCatData = {}

            for (let category of currentCats) {
                newCatData[category] = this.catData.hasOwnProperty(category)
                    ? this.catData[category]
                    : []
            }

            this.catData = newCatData
            this.setState({ categories: catIds })
        }
        if (prevProps.pointUpdateId !== props.pointUpdateId) {
            this._updatePoints()
            console.log(this.catData)
        }
    }

    _getGraphCatNames = catIds => {
        let catNames = []
        for (let catId of catIds) {
            catNames.push(this.props.categories[catId].category)
        }
        return catNames
    }

    _getRange = () => {
        return this.props.ranges[this.props.graphs[this.graphId].range]
    }

    _updatePoints = () => {
        if (!this.props.graphs.hasOwnProperty(this.graphId)) {
            return
        }

        for (let [category, points] of Object.entries(this.props.pointUpdate)) {
            if (this.catData.hasOwnProperty(category)) {
                insertPoints(this.catData[category], points, this._getRange())
            }
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
                        graphId={this.graphId}
                        listener={props.listener}
                        availableCats={props.availableCats}
                    />
                </div>
            )
        }
    }
}

const mapStateToProps = state => {
    return {
        graphs: state.graphs,
        ranges: state.ranges,
        categories: state.categories,
        pointUpdate: state.pointUpdate,
        pointUpdateId: state.pointUpdateId,
    }
}

export default connect(mapStateToProps)(GraphTile)
