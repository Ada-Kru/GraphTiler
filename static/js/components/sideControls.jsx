import React, { Component } from "react"

class SideControls extends Component {
    constructor(props) {
        super(props)
    }

    render() {
        return (
            <div className="side-controls">
                <span
                    className="ctrl-button"
                    title="Add new graph tile"
                    onClick={this.props.addGraphTile}
                >
                    +
                </span>
                <br />
                <span
                    className="connection-indicator not-connected"
                    title="Not connected"
                >
                    ❌
                </span>
            </div>
        )
    }
}

export default SideControls
