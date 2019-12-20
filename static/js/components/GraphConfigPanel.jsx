import React, { Component } from "react"
import { connect } from "react-redux"
import { updateGraphCfg } from "../redux"
import DateTimePicker from "react-datetime-picker"
import CategoryTile from "./CategoryTile"

const DATETIME_FORMAT = "MM-dd-y hh:mm a"
const NEW_CAT_DATA = {
    label: "",
    borderColor: "#FFFFFF",
    fill: true,
    borderWidth: 3,
    lineTension: 0,
    backgroundColor: "#444444",
    pointRadius: 2,
    pointStyle: "circle",
    pointBackgroundColor: "#FFFFFF",
    pointBorderColor: "#FFFFFF",
    pointHoverBackgroundColor: "#888888",
    pointHoverBorderColor: "#999999",
}

const getCategories = (catIds, catData) => {
    let catItems = {}
    for (let catId of catIds) {
        catItems[catData[catId].category] = catData[catId]
    }
    return catItems
}

class GraphConfigPanel extends Component {
    constructor(props) {
        super(props)

        let graphId = props.graphId,
            catIds = [],
            state = {
                rangeType: "past",
                since: new Date(),
                rangeStart: new Date(),
                rangeEnd: new Date(),
                pastAmount: 1,
                pastUnit: "hr",
                addingNewCat: false,
                editingRange: false,
                legendDisplay: true,
                legendPosition: "top",
                downsampThreshold: 0,
                downsampEnabled: false,
            }

        if (props.graphs[graphId]) {
            let graph = props.graphs[graphId],
                rangeData = props.ranges[graph.range]

            catIds = graph.categories
            state.rangeType = rangeData.rangeType
            state.legendDisplay = graph.legendDisplay
            state.legendPosition = graph.legendPosition
            state.downsampThreshold = graph.downsampThreshold
            state.downsampEnabled = graph.downsampEnabled

            switch (state.rangeType) {
                case "past": {
                    state.pastAmount = rangeData.pastAmount
                    state.pastUnit = rangeData.pastUnit
                    break
                }
                case "since": {
                    state.since = new Date(rangeData.since)
                    break
                }
                case "timerange": {
                    state.rangeStart = new Date(rangeData.start)
                    state.rangeEnd = new Date(rangeData.end)
                    break
                }
            }
        }

        state.categories = getCategories(catIds, props.categories)
        this.state = state

        this.snapshot = {}
        this.rangeForm = React.createRef()
        this.saveButton = React.createRef()
    }

    componentDidUpdate = prevProps => {
        if (!this.props.graphs[this.props.graphId]) {
            return true
        }
        let props = this.props,
            graphId = props.graphId

        let prevGraph = prevProps.graphs[props.graphId],
            prevCatIds = prevGraph ? prevGraph.categories : [],
            curCatIds = props.graphs[props.graphId].categories
        if (prevCatIds != curCatIds) {
            let catData = props.categories
            this.setState({ categories: getCategories(curCatIds, catData) })
        }
    }

    saveSnapshot = () => {
        this.snapshot = {
            rangeType: this.state.rangeType,
            since: this.state.since,
            rangeStart: this.state.rangeStart,
            rangeEnd: this.state.rangeEnd,
            pastAmount: this.state.pastAmount,
            pastUnit: this.state.pastUnit,
        }
    }

    onEditRange = () => {
        this.saveSnapshot()
        this.setState({ editingRange: true })
    }

    onSaveButtonBlur = () => {
        this.saveButton.current.setCustomValidity("")
    }

    onEditRangeSave = () => {
        if (!this.rangeForm.current.reportValidity()) {
            return
        }
        if (
            this.state.rangeType === "timerange" &&
            this.state.rangeStart >= this.state.rangeEnd
        ) {
            this.saveButton.current.setCustomValidity(
                "End of time range must be later than start!"
            )
            return
        }
        let data = { range: { rangeType: this.state.rangeType } }
        switch (this.state.rangeType) {
            case "since":
                data.range.since = this.state.since
                break
            case "timerange":
                data.range.start = this.state.rangeStart
                data.range.end = this.state.rangeEnd
                break
            case "past":
                data.range.pastAmount = parseInt(this.state.pastAmount)
                data.range.pastUnit = this.state.pastUnit
        }

        this.props.onRangeChange()
        this.props.listener(this.props.graphId, { modifyGraphRange: data })
        this.setState({ editingRange: false })
    }

    onEditRangeCancel = () => {
        this.setState({ editingRange: false, ...this.snapshot })
    }

    addCategory = () => {
        if (this.state.addingNewCat) {
            return
        }

        this.setState({ addingNewCat: true })
    }

    onrangeTypeChange = evt => {
        this.setState({ rangeType: evt.target.value })
    }

    onSinceChange = newSince => {
        this.setState({ since: newSince })
    }

    onRangeStartChange = newStart => {
        this.setState({ rangeStart: newStart })
    }

    onRangeEndChange = newEnd => {
        this.setState({ rangeEnd: newEnd })
    }

    onPastAmountChange = evt => {
        this.setState({ pastAmount: evt.target.value })
    }

    onPastUnitChange = evt => {
        this.setState({ pastUnit: evt.target.value })
    }

    onLegendChange = evt => {
        let val = evt.target.value
        this.setState(
            { legendPosition: val, legendDisplay: val !== "disabled" },
            () => this.onGraphConfigChange()
        )
    }

    onDownsamplingChange = evt => {
        let val = evt.target.value
        this.setState(
            { downsampThreshold: parseInt(val), downsampEnabled: val !== "0" },
            () => this.onGraphConfigChange()
        )
    }

    onGraphConfigChange = newCfg => {
        this.props.updateGraphCfg(this.props.graphId, {
            legendDisplay: this.state.legendDisplay,
            legendPosition: this.state.legendPosition,
            downsampEnabled: this.state.downsampEnabled,
            downsampThreshold: this.state.downsampThreshold,
        })
    }

    onCatSave = data => {
        this.setState({ addingNewCat: false })
        this.props.listener(this.props.graphId, {
            addCategory: data,
        })
    }

    onCatCancel = () => {
        this.setState({ addingNewCat: false })
    }

    onCatRemove = data => {
        if (data.category.length) {
            this.props.listener(this.props.graphId, {
                removeCategory: data,
            })
        }
    }

    makeFooter = () => {
        return this.state.editingRange ? (
            <span className="cat-tile-footer">
                <button
                    ref={this.saveButton}
                    onClick={this.onEditRangeSave}
                    onBlur={this.onSaveButtonBlur}
                >
                    Save
                </button>
                <button onClick={this.onEditRangeCancel}>Cancel</button>
            </span>
        ) : null
    }

    makeConfigForm = () => {
        let rangeInputs = null
        let cfgButton = this.state.editingRange ? null : (
            <span
                className="cat-tile-button"
                title="Edit monitoring range"
                onClick={this.onEditRange}
            >
                ⛭
            </span>
        )
        switch (this.state.rangeType) {
            case "past":
                rangeInputs = (
                    <div className="flex-div">
                    <label>
                        Past
                        <input
                            className="gt-input"
                            value={this.state.pastAmount}
                            onChange={this.onPastAmountChange}
                            min="1"
                            type="number"
                        />
                        </label>
                        <select
                            className="gt-input"
                            value={this.state.pastUnit}
                            onChange={this.onPastUnitChange}
                        >
                            <option value="sec">Seconds</option>
                            <option value="min">Minutes</option>
                            <option value="hr">Hours</option>
                        </select>
                        </div>
                )
                break
            case "timerange":
                rangeInputs = (
                    <div className="flex-div">
                        <label>
                            Start
                            <DateTimePicker
                                onChange={this.onRangeStartChange}
                                value={this.state.rangeStart}
                                calendarIcon={null}
                                clearIcon={null}
                                disableClock={true}
                                format={DATETIME_FORMAT}
                                disabled={!this.state.editingRange}
                            />
                        </label>
                        <label>
                            End
                            <DateTimePicker
                                onChange={this.onRangeEndChange}
                                value={this.state.rangeEnd}
                                calendarIcon={null}
                                clearIcon={null}
                                disableClock={true}
                                format={DATETIME_FORMAT}
                                disabled={!this.state.editingRange}
                            />
                        </label>
                    </div>
                )
                break
            case "since":
                rangeInputs = (
                    <label>
                        Since
                        <DateTimePicker
                            onChange={this.onSinceChange}
                            value={this.state.since}
                            calendarIcon={null}
                            clearIcon={null}
                            disableClock={true}
                            format={DATETIME_FORMAT}
                            disabled={!this.state.editingRange}
                        />
                    </label>
                )
                break
        }

        return (
            <form ref={this.rangeForm} onSubmit={evt => evt.preventDefault()}>
                <label className="fieldset-legend">
                    Monitoring Range {cfgButton}
                </label>
                <fieldset
                    className="range-cfg-fieldset"
                    disabled={!this.state.editingRange}
                >
                    <fieldset>
                        <legend>
                            Range
                            <select
                                className="legend-input"
                                value={this.state.rangeType}
                                onChange={this.onrangeTypeChange}
                            >
                                <option value="past">Past X</option>
                                <option value="timerange">Time range</option>
                                <option value="since">Since time</option>
                            </select>
                        </legend>
                        <div className="fieldset-wrapper">
                        {rangeInputs}
                        </div>
                    </fieldset>
                    {this.makeFooter()}
                </fieldset>
            </form>
        )
    }

    render() {
        return (
            <div className="configPanel y-scroll">
                <div className="graphSettings">
                    {this.makeConfigForm()}
                    <form>
                        <fieldset>
                            <legend>Graph Options</legend>
                            <div className="fieldset-wrapper">
                            <label>
                                Legend position
                                <select
                                    className="gt-input"
                                    defaultValue="top"
                                    onChange={this.onLegendChange}
                                >
                                    <option value="top">Top</option>
                                    <option value="left">Left</option>
                                    <option value="bottom">Bottom</option>
                                    <option value="right">Right</option>
                                    <option value="disabled">Disabled</option>
                                </select>
                            </label>
                            <label>
                                Max visible points
                                <select
                                    className="gt-input"
                                    defaultValue="0"
                                    onChange={this.onDownsamplingChange}
                                >
                                    <option value="60">60</option>
                                    <option value="100">100</option>
                                    <option value="150">150</option>
                                    <option value="200">200</option>
                                    <option value="300">300</option>
                                    <option value="500">500</option>
                                    <option value="1000">1000</option>
                                    <option value="0">All</option>
                                </select>
                            </label>
                            </div>
                        </fieldset>
                    </form>
                    <span className="config-row">
                        Categories
                        <span
                            className="ctrl-button"
                            title="Add new category"
                            onClick={this.addCategory}
                        >
                            +
                        </span>
                    </span>
                    <div className="cat-tile-container">
                        {this.state.addingNewCat ? (
                            <CategoryTile
                                data={NEW_CAT_DATA}
                                category=""
                                onRemove={this.onCatRemove}
                                onSave={this.onCatSave}
                                onCancel={this.onCatCancel}
                                graphId={this.props.graphId}
                                editing={true}
                            />
                        ) : null}
                        {Object.keys(this.state.categories).map(key => {
                            return (
                                <CategoryTile
                                    key={key}
                                    data={this.state.categories[key]}
                                    category={key}
                                    onRemove={this.onCatRemove}
                                    onSave={this.onCatSave}
                                    onCancel={this.onCatCancel}
                                    graphId={this.props.graphId}
                                />
                            )
                        })}
                    </div>
                </div>
            </div>
        )
    }
}

const mapStateToProps = state => {
    return {
        graphs: state.graphs,
        ranges: state.ranges,
        categories: state.categories,
    }
}

const mapDispatchToProps = dispatch => {
    let ugc = (graphId, cfg) => dispatch(updateGraphCfg(graphId, cfg))
    return { updateGraphCfg: ugc }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(GraphConfigPanel)
