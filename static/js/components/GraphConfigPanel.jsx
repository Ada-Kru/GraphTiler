import React, { Component } from "react"
import { connect } from "react-redux"
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
            rangeType = "past",
            pastAmount = 1,
            pastUnit = "hr",
            since = new Date(),
            rangeStart = new Date(),
            rangeEnd = new Date(),
            catIds = []

        if (props.graphs[graphId]) {
            let graph = props.graphs[graphId],
                rangeData = props.ranges[graph.range]

            rangeType = rangeData.rangeType
            catIds = graph.categories

            switch (rangeType) {
                case "past": {
                    pastAmount = rangeData.pastAmount
                    pastUnit = rangeData.pastUnit
                    break
                }
                case "since": {
                    since = new Date(rangeData.since)
                    break
                }
                case "timerange": {
                    rangeStart = new Date(rangeData.start)
                    rangeEnd = new Date(rangeData.end)
                    break
                }
            }
        }

        this.state = {
            rangeType: rangeType,
            since: since,
            rangeStart: rangeStart,
            rangeEnd: rangeEnd,
            pastAmount: pastAmount,
            pastUnit: pastUnit,
            addingNewCat: false,
            editingRange: false,
            categories: getCategories(catIds, props.categories),
        }

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
                    <span className="config-row">
                        <label>
                            Past
                            <span>
                                <input
                                    value={this.state.pastAmount}
                                    onChange={this.onPastAmountChange}
                                    min="1"
                                    type="number"
                                />
                                <select
                                    value={this.state.pastUnit}
                                    onChange={this.onPastUnitChange}
                                >
                                    <option value="sec">Seconds</option>
                                    <option value="min">Minutes</option>
                                    <option value="hr">Hours</option>
                                </select>
                            </span>
                        </label>
                    </span>
                )
                break
            case "timerange":
                rangeInputs = (
                    <div>
                        <span className="config-row">
                            <label>
                                Start
                                <DateTimePicker
                                    onChange={this.onRangeStartChange}
                                    value={this.state.rangeStart}
                                    calendarIcon={null}
                                    clearIcon={null}
                                    disableClock={true}
                                    format={DATETIME_FORMAT}
                                />
                            </label>
                        </span>
                        <span className="config-row">
                            <label>
                                End
                                <DateTimePicker
                                    onChange={this.onRangeEndChange}
                                    value={this.state.rangeEnd}
                                    calendarIcon={null}
                                    clearIcon={null}
                                    disableClock={true}
                                    format={DATETIME_FORMAT}
                                />
                            </label>
                        </span>
                    </div>
                )
                break
            case "since":
                rangeInputs = (
                    <span className="config-row">
                        <label>
                            Since
                            <DateTimePicker
                                onChange={this.onSinceChange}
                                value={this.state.since}
                                calendarIcon={null}
                                clearIcon={null}
                                disableClock={true}
                                format={DATETIME_FORMAT}
                            />
                        </label>
                    </span>
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
                    <span className="config-row">
                        <label>
                            Range type
                            <select
                                value={this.state.rangeType}
                                onChange={this.onrangeTypeChange}
                            >
                                <option value="past">Past X</option>
                                <option value="timerange">Time range</option>
                                <option value="since">Since time</option>
                            </select>
                        </label>
                    </span>
                    {rangeInputs}
                    {this.makeFooter()}
                </fieldset>
            </form>
        )
    }

    render() {
        return (
            <div className="configPanel">
                <div className="graphSettings">
                    {this.makeConfigForm()}
                    <form>
                        <fieldset>
                            <legend>Graph Options</legend>
                            <span className="config-row">
                                <label>
                                    Legend position
                                    <select defaultValue="top">
                                        <option value="top">Top</option>
                                        <option value="left">Left</option>
                                        <option value="bottom">Bottom</option>
                                        <option value="right">Right</option>
                                        <option value="disabled">
                                            Disabled
                                        </option>
                                    </select>
                                </label>
                            </span>
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
                    <div className="y-scroll cat-tile-container">
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

export default connect(mapStateToProps)(GraphConfigPanel)
