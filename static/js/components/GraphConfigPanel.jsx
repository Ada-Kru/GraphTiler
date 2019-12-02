import React, { Component } from "react"
import DateTimePicker from "react-datetime-picker"
import CategoryTile from "./CategoryTile"

const DATETIME_FORMAT = "MM-dd-y hh:mm a"
const NEW_CAT_DATA = { lineColor: "#FFFFFF" }

class GraphConfigPanel extends Component {
    constructor(props) {
        super(props)

        let monitorType = "past"
        let pastAmount = 1
        let pastUnit = "hr"
        let since = new Date()
        let rangeStart = new Date()
        let rangeEnd = new Date()

        if (props.graphs[props.graphId]) {
            let data = props.graphs[props.graphId].range
            console.log("found graph data", data)
            if (data.hasOwnProperty("past")) {
                pastAmount = data.past
                pastUnit = "sec"
            } else if (data.hasOwnProperty("since")) {
                monitorType = "since"
                since = new Date(data.since)
            } else if (data.hasOwnProperty("start")) {
                monitorType = "range"
                rangeStart = new Date(data.start)
                rangeEnd = new Date(data.end)
            }
        }

        this.state = {
            monitorType: monitorType,
            since: since,
            rangeStart: rangeStart,
            rangeEnd: rangeEnd,
            pastAmount: pastAmount,
            pastUnit: pastUnit,
            addingNewCat: false,
            editingRange: false,
            categories: this.props.categories || {},
        }

        this.snapshot = {}
    }

    componentDidUpdate = prevProps => {
        if (prevProps.categories != this.props.categories) {
            this.setState({ categories: this.props.categories })
        }
    }

    saveSnapshot = () => {
        this.snapshot = {
            monitorType: this.state.monitorType,
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

    onEditRangeSave = () => {
        let data = {}
        let mtype = this.state.monitorType
        switch (mtype) {
            case "since":
                data.since = this.state.since
                break
            case "range":
                data.start = this.state.rangeStart
                data.end = this.state.rangeEnd
                break
            case "past":
                data.past = this.state.pastAmount
                if (this.state.pastUnit == "hr") {
                    data.past *= 3600
                } else if (this.state.pastUnit == "min") {
                    data.past *= 60
                }
        }

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

    onMonitorTypeChange = evt => {
        this.setState({ monitorType: evt.target.value })
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
        this.props.listener(this.props.graphId, {
            removeCategory: data,
        })
    }

    makeHeader = () => {
        return this.state.editingRange ? null : (
            <div className="cat-tile-header">
                <span
                    className="cat-tile-button"
                    title="Modify monitor range"
                    onClick={this.onEditRange}
                >
                    ⛭
                </span>
            </div>
        )
    }

    makeFooter = () => {
        return this.state.editingRange ? (
            <span className="cat-tile-footer">
                <button onClick={this.onEditRangeSave}>Save</button>
                <button onClick={this.onEditRangeCancel}>Cancel</button>
            </span>
        ) : null
    }

    makeMonitorConfig = () => {
        let rangeInputs = null
        switch (this.state.monitorType) {
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
            case "range":
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
            <form>
                {this.makeHeader()}
                <fieldset disabled={!this.state.editingRange}>
                    <span className="config-row">
                        <label>
                            Monitoring type
                            <select
                                value={this.state.monitorType}
                                onChange={this.onMonitorTypeChange}
                            >
                                <option value="past">Past X</option>
                                <option value="range">Time range</option>
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
                    {this.makeMonitorConfig()}
                    <span className="config-row">
                        <label>
                            Legend position
                            <select defaultValue="top">
                                <option value="top">Top</option>
                                <option value="left">Left</option>
                                <option value="bottom">Bottom</option>
                                <option value="right">Right</option>
                                <option value="disabled">Disabled</option>
                            </select>
                        </label>
                    </span>
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
                                editing={true}
                            />
                        ) : null}
                        {Object.keys(this.state.categories).map(key => {
                            return (
                                <CategoryTile
                                    key={key}
                                    data={this.props.categories[key]}
                                    category={key}
                                    onRemove={this.onCatRemove}
                                    onSave={this.onCatSave}
                                    onCancel={this.onCatCancel}
                                />
                            )
                        })}
                    </div>
                </div>
            </div>
        )
    }
}

export default GraphConfigPanel
