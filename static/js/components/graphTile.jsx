import React, { Component } from "react"
import { connect } from "react-redux"
import { Line, Bar, Radar, Polar } from "react-chartjs-2"
import GraphConfigPanel from "./GraphConfigPanel"
import insertPoints from "./insertPoints"
import removeKeys from "./removeKeys"
import DataSetContainer from "./DataSetContainer"
import moment from "moment"

class GraphTile extends Component {
    constructor(props) {
        super(props)
        let cfg = props.node.getConfig()

        this.state = {
            configPanelOpen: cfg.configPanelOpen,
            catIds: this._getCatIds(),
            forceRedraw: false,
        }
        this.graphId = cfg.graphId
        this.datasets = new DataSetContainer(
            this.graphId,
            this._makeReduxState()
        )

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
        let shouldRedraw = false,
            graphUpdated =
                prevProps.graphUpdateId !== this.props.graphUpdateId &&
                this.props.graphsUpdated.includes(this.graphId)
        this.datasets.updateReduxState(this._makeReduxState())

        if (graphUpdated) {
            shouldRedraw = true
            this.datasets.updateCats(this._getGraphCatNames())
            this.datasets.updateGraphOptions()
            console.log("datasets: ", this.datasets)
            this.setState({ catIds: this._getCatIds() })
        }
        if (prevProps.pointUpdateId !== this.props.pointUpdateId) {
            shouldRedraw = this._updatePoints() || shouldRedraw
        }
        if (shouldRedraw) this.setState({ forceRedraw: shouldRedraw })
        else if (this.state.forceRedraw) this.setState({ forceRedraw: false })
    }

    _makeReduxState = () => {
        return {
            graphs: this.props.graphs,
            ranges: this.props.ranges,
            categories: this.props.categories,
            pointUpdate: this.props.pointUpdate,
            pointUpdateId: this.props.pointUpdateId,
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
        return this.datasets.updatePoints()
    }

    onRangeChange = () => {
        this.datasets.clearAllData()
    }

    _getDatasetKey = data => {
        return data.category
    }

    _makeChart = () => {
        return (
            <Line
                data={this.datasets.datasets}
                options={this.datasets.options}
                datasetKeyProvider={this._getDatasetKey}
                redraw={this.state.forceRedraw}
            />
        )
    }

    render() {
        if (!this.state.configPanelOpen) {
            return (
                <div className="graphTile">
                    <div className="graphHolder">{this._makeChart()}</div>
                </div>
            )
        } else {
            return (
                <div className="graphTile">
                    <div className="graphHolder configOpen">
                        {this._makeChart()}
                    </div>
                    <GraphConfigPanel
                        graphId={this.graphId}
                        listener={this.props.listener}
                        availableCats={this.props.availableCats}
                        onRangeChange={this.onRangeChange}
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
        graphUpdateId: state.graphUpdateId,
        graphsUpdated: state.graphsUpdated,
    }
}

export default connect(mapStateToProps)(GraphTile)
