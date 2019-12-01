import React, { Component } from "react"
import DateTimePicker from "react-datetime-picker"
import CategoryTile from "./CategoryTile"

const DATETIME_FORMAT = "MM-dd-y hh:mm a"
const NEW_CAT_DATA = { lineColor: "#FFFFFF" }

class GraphConfigPanel extends Component {
    constructor(props) {
        super(props)

        setInterval(() => console.log(this.props), 3000)
        this.state = {
            monitorType: "past",
            from: new Date(),
            rangeStart: new Date(),
            rangeEnd: new Date(),
            pastAmount: 1,
            pastUnit: "hr",
            addingNewCat: false,
        }
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

    onFromChange = newFrom => {
        this.setState({ from: newFrom })
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

    renderMonitorConfig = type => {
        switch (type) {
            case "past":
                return (
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

            case "range":
                return (
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

            case "since":
                return (
                    <span className="config-row">
                        <label>
                            Since
                            <DateTimePicker
                                onChange={this.onFromChange}
                                value={this.state.from}
                                calendarIcon={null}
                                clearIcon={null}
                                disableClock={true}
                                format={DATETIME_FORMAT}
                            />
                        </label>
                    </span>
                )
        }
    }

    render() {
        return (
            <div className="configPanel">
                <div className="graphSettings">
                    <span className="config-row">
                        <label>
                            Monitoring type
                            <select
                                defaultValue="past"
                                onChange={this.onMonitorTypeChange}
                            >
                                <option value="past">Past X</option>
                                <option value="range">Time range</option>
                                <option value="since">Since time</option>
                            </select>
                        </label>
                    </span>
                    {this.renderMonitorConfig(this.state.monitorType)}
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
                    {this.state.addingNewCat ? (
                        <CategoryTile
                            data={NEW_CAT_DATA}
                            category=""
                            onCatSave={this.onCatSave}
                            editing={true}
                        />
                    ) : null}
                    {this.props.categories !== undefined &&
                        Object.keys(this.props.categories).length &&
                        Object.keys(this.props.categories).map(key => {
                            console.log("key", key)
                            return (
                                <CategoryTile
                                    key={key}
                                    data={this.props.categories[key]}
                                    category={key}
                                    onCatSave={this.onCatSave}
                                />
                            )
                        })}
                </div>
            </div>
        )
    }
}

export default GraphConfigPanel
