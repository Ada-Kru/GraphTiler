import React, { Component } from "react"

class SideControls extends Component {
    constructor(props) {
        super(props)
    }

    render() {
        let wsSymbol = ""
        switch (this.props.wsState) {
            default:
            case "disconnected":
                wsSymbol = "𝙭"
                break
            case "connecting":
                wsSymbol = "…"
                break
            case "connected":
                wsSymbol = "✔"
                break
        }

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
                    className={`connection-indicator ${this.props.wsState}`}
                    title={`Connection status: ${this.props.wsState}`}
                >
                    {wsSymbol}
                </span>
            </div>
        )
    }
}

export default SideControls
