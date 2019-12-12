import React, { Component } from "react"
import { connect } from "react-redux"
import { Line, Bar, Radar, Polar } from "react-chartjs-2"
import GraphConfigPanel from "./GraphConfigPanel"
import insertPoints from "./insertPoints"
import removeKeys from "./removeKeys"
import DataSetContainer from "./DataSetContainer"
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

// const data = {
//     datasets: [
//         {
//             fill: true,
//             label: "Test Data",
//             lineTension: 0,
//             backgroundColor: "#444",
//             borderColor: "#0F0",
//             pointStyle: "rectRounded",
//             pointBackgroundColor: "#0F0",
//             pointHoverBackgroundColor: "#888",
//             pointHoverBorderColor: "#999",
//             pointHoverBorderWidth: 2,
//             data: [
//                 { x: "2019-12-05 10:15", y: 65 },
//                 { x: "2019-12-05 10:30", y: 59 },
//                 { x: "2019-12-05 10:45", y: 80 },
//                 { x: "2019-12-05 11:00", y: 81 },
//                 { x: "2019-12-05 11:15", y: 56 },
//                 { x: "2019-12-05 11:30", y: 55 },
//                 { x: "2019-12-05 11:45", y: 40 },
//                 { x: "2019-12-05 12:00", y: 56 },
//             ],
//         },
//     ],
// }

class GraphTile extends Component {
    constructor(props) {
        super(props)
        let cfg = props.node.getConfig()

        this.state = {
            configPanelOpen: cfg.configPanelOpen,
            catIds: this._getCatIds(),
        }
        this.graphId = cfg.graphId
        this.datasets = new DataSetContainer(this.graphId, props.reduxState)
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
        this.datasets.updateReduxState(this.props.reduxState)
        if (!arrEqual(this._getCatIds(), this.state.catIds)) {
            this.datasets.updateCats(this._getGraphCatNames())
            console.log("datasets: ", this.datasets)
            this.setState({ catIds: this._getCatIds() })
        }
        if (prevProps.pointUpdateId !== this.props.pointUpdateId) {
            this._updatePoints()
            console.log("catData:", this.catData)
        }
    }

    _isRegistered = () => {
        return this.props.graphs.hasOwnProperty(this.graphId)
    }

    _getCatIds = () => {
        return this._isRegistered()
            ? this.props.graphs[this.graphId].categories
            : []
    }

    _getGraphCatNames = () => {
        let catNames = []
        for (let catId of this._getCatIds()) {
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
        this.datasets.updatePoints()
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
                        <Line
                            data={this.datasets.datasets}
                            options={this.datasets.options}
                        />
                    </div>
                    <GraphConfigPanel
                        graphId={this.graphId}
                        listener={this.props.listener}
                        availableCats={this.props.availableCats}
                    />
                </div>
            )
        }
    }
}

const mapStateToProps = state => {
    return {
        reduxState: state,
        graphs: state.graphs,
        ranges: state.ranges,
        categories: state.categories,
        pointUpdate: state.pointUpdate,
        pointUpdateId: state.pointUpdateId,
    }
}

export default connect(mapStateToProps)(GraphTile)
