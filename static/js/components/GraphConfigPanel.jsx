import React, { Component } from "react"
import DateTimePicker from "react-datetime-picker"

const DATETIME_FORMAT = "MM-dd-y hh:mm a"

class GraphConfigPanel extends Component {
    constructor(props) {
        super(props)
        this.state = {
            monitorType: "past",
            from: new Date(),
            rangeStart: new Date(),
            rangeEnd: new Date(),
            pastAmount: 1,
            pastUnit: "hr",
        }
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

    renderMonitorConfig = type => {
        switch (type) {
            case "past":
                return (
                    <span className="configRow">
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

            case "from":
                return (
                    <span className="configRow">
                        <label>
                            From
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

            case "range":
                return (
                    <div>
                        <span className="configRow">
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
                        <span className="configRow">
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
        }
    }

    render() {
        return (
            <div className="configPanel">
                <div className="graphSettings">
                    <span className="configRow">
                        <label>
                            Monitoring type
                            <select
                                defaultValue="past"
                                onChange={this.onMonitorTypeChange}
                            >
                                <option value="past">Past X</option>
                                <option value="range">Time range</option>
                                <option value="from">From time</option>
                            </select>
                        </label>
                    </span>
                    {this.renderMonitorConfig(this.state.monitorType)}
                    <span className="configRow">
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
                    <span className="configRow">
                        Categories
                        <span className="ctrl-button" title="Add new category">
                            +
                        </span>
                    </span>
                </div>
            </div>
        )
    }
}

export default GraphConfigPanel
