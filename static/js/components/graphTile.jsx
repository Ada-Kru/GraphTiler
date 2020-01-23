import React, { Component } from "react"
import { connect } from "react-redux"
import { Line, Bar, Radar, Polar, Chart } from "react-chartjs-2"
import DownsamplePlugin from "chartjs-plugin-downsample"
import GraphConfigPanel from "./GraphConfigPanel"
import DataSetContainer from "../classes/DataSetContainer"
import moment from "moment"

class GraphTile extends Component {
    constructor(props) {
        super(props)
        let cfg = props.node.getConfig()
        this.graphId = cfg.graphId
        let catIds = this._getCatIds()

        this.state = {
            configPanelOpen: catIds.length == 0,
            catIds: catIds,
            gradient: null,
            key: 0,
        }
        this.datasets = new DataSetContainer(
            this.graphId,
            this._makeReduxState()
        )
        this.timerId = null
        this.firstLoad = true
        this.pointsUpdated = true

        props.node.setEventListener("configPanelOpen", () => {
            this.setState(prevState => {
                return { configPanelOpen: !prevState.configPanelOpen }
            })
        })

        props.node.setEventListener("close", () => {
            clearInterval(this.timerId)
            this.props.listener(cfg.graphId, { removeGraph: true })
        })
    }

    componentDidUpdate = prevProps => {
        let shouldRedraw = false,
            pointsUpdated = false,
            graphUpdated =
                prevProps.graphUpdateId !== this.props.graphUpdateId &&
                this.props.graphsUpdated.includes(this.graphId)
        this.datasets.updateReduxState(this._makeReduxState())

        if (graphUpdated || this.firstLoad) {
            shouldRedraw = true
            this.datasets.updateCats(this._getGraphCatNames())
            this.datasets.updateGraphOptions()
            this._setRangeTimer()
            let gd = this._getGraphData()
            this.setState({
                gradient: {
                    gradientDegrees: gd.gradientDegrees,
                    gradient1: gd.gradient1,
                    gradient2: gd.gradient2,
                },
            })
            // console.log("datasets: ", this.datasets)
            this.setState({ catIds: this._getCatIds() })
        }
        if (prevProps.pointUpdateId !== this.props.pointUpdateId) {
            pointsUpdated = this._onUpdatePoints() || pointsUpdated
            pointsUpdated = this._onRemovePoints() || pointsUpdated
        }
        let updatePts = pointsUpdated && this._getRange().rangeType !== "past"
        if (shouldRedraw || updatePts) {
            this._updateGraph()
        }
        this.firstLoad = false
        this.pointsUpdated = pointsUpdated || this.pointsUpdated
    }

    UNSAFE_componentWillMount = () => {
        Chart.plugins.register(DownsamplePlugin)
    }

    componentWillUnmount = () => {
        clearInterval(this.timerId)
    }

    _updateGraph = () => {
        this.datasets.onBeforeUpdate()
        this.setState({ key: Math.random() })
    }

    _makeReduxState = () => {
        return {
            graphs: this.props.graphs,
            ranges: this.props.ranges,
            categories: this.props.categories,
            pointUpdate: this.props.pointUpdate,
            pointRemove: this.props.pointRemove,
            pointUpdateId: this.props.pointUpdateId,
        }
    }

    _getCatIds = () => {
        return this.props.graphs[this.graphId].categories
    }

    _getGraphCatNames = () => {
        let catNames = []
        for (let catId of this._getCatIds()) {
            catNames.push(this.props.categories[catId].category)
        }
        return catNames
    }

    _getGraphData = () => {
        return this.props.graphs[this.graphId]
    }

    _getRange = () => {
        return this.props.ranges[this.props.graphs[this.graphId].range]
    }

    _onUpdatePoints = () => {
        if (!this.props.graphs.hasOwnProperty(this.graphId)) {
            return
        }
        return this.datasets.updatedPoints()
    }

    _onRemovePoints = () => {
        if (!this.props.graphs.hasOwnProperty(this.graphId)) {
            return
        }
        return this.datasets.removedPoints()
    }

    _setRangeTimer = () => {
        let range = this._getRange()
        clearInterval(this.timerId)
        this.timerId = null

        if (range.rangeType === "past") {
            let pastSeconds = range.pastAmount
            if (range.pastUnit === "min") {
                pastSeconds *= 60
            } else if (range.pastUnit === "hr") {
                pastSeconds *= 3600
            }
            this.timerId = setInterval(() => {
                let updated = this.datasets.removePointsBeforeTime(pastSeconds)
                if (updated || this.pointsUpdated) {
                    this.pointsUpdated = false
                    this._updateGraph()
                }
            }, 1000)
        }
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
                key={this.state.key}
            />
        )
    }

    _makeGradientStyle = () => {
        if (this.state.gradient == null) return {}
        let gd = this.state.gradient,
            lg = `linear-gradient(${gd.gradientDegrees}deg, ${gd.gradient1}, ${gd.gradient2})`
        return { background: lg }
    }

    render() {
        if (!this.state.configPanelOpen) {
            return (
                <div className="graphTile">
                    <div
                        className="graphHolder"
                        style={this._makeGradientStyle()}
                    >
                        {this._makeChart()}
                    </div>
                </div>
            )
        } else {
            return (
                <div className="graphTile">
                    <div
                        className="graphHolder configOpen"
                        style={this._makeGradientStyle()}
                    >
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
        pointRemove: state.pointRemove,
        pointUpdateId: state.pointUpdateId,
        graphUpdateId: state.graphUpdateId,
        graphsUpdated: state.graphsUpdated,
    }
}

export default connect(mapStateToProps)(GraphTile)
