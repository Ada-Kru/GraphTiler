import React, { Component } from "react"
import ReactModal from "react-modal"

ReactModal.defaultStyles.overlay.backgroundColor = "#222"
ReactModal.defaultStyles.content.backgroundColor = "#333"

class SideControls extends Component {
    constructor(props) {
        super(props)
        this.state = {
            showModal: false,
            loading: true,
            error: false,
            layouts: [],
        }
    }

    onShowHideModal = () => {
        if (!this.state.showModal) {
            this.setState({ showModal: true })
            fetch("/layouts/")
                .then(response => {
                    return response.json()
                })
                .then(json => {
                    //console.log(json)
                    let layouts = json.layouts.map(item => {
                        let name = item["name"]
                        return (
                            <li className="layout-list-item" key={name}>
                                <span
                                    className="layout-list-name"
                                    onClick={() => this.onLoadLayout(name)}
                                >
                                    {name}
                                </span>
                                <span
                                    className="list-item-delete-x"
                                    title="Delete"
                                    onClick={() => this.onDeleteLayout(name)}
                                >
                                    ✖
                                </span>
                            </li>
                        )
                    })
                    this.setState({ loading: false, layouts: layouts })
                })
                .catch(e => {
                    this.setState({ loading: false, error: true })
                })
        } else {
            this.setState({
                showModal: false,
                loading: true,
                error: false,
                layouts: [],
            })
        }
    }

    onSaveLayout = name => {
        console.log("onSaveLayout", name)
    }

    onLoadLayout = name => {
        console.log("onLoadLayout", name)
    }

    onDeleteLayout = name => {
        console.log("onDeleteLayout", name)
    }

    makeLayoutList = () => {
        if (this.state.loading) {
            return <div className="modalCentered">Loading...</div>
        } else if (this.state.error) {
            return (
                <div className="modalCentered">
                    Error loading layouts from server.
                </div>
            )
        } else {
            return (
                <div className="modalCentered">
                    <ul className="layout-list">{this.state.layouts}</ul>
                </div>
            )
        }
    }

    render() {
        return (
            <div className="side-controls">
                <ReactModal
                    isOpen={this.state.showModal}
                    ariaHideApp={false}
                    contentLabel="Save\Load Modal"
                >
                    <span
                        className="modal-close-x"
                        title="Close"
                        onClick={this.onShowHideModal}
                    >
                        ✖
                    </span>
                    <div className="modal-content">
                        <input
                            className="gt-input"
                            type="text"
                            placeholder="Save current layout"
                        />
                        <button
                            className="gt-button"
                            title="Save current layout"
                            onClick={this.onSaveLayout}
                        >
                            Save
                        </button>
                    </div>
                    {this.makeLayoutList()}
                </ReactModal>
                <span
                    className="ctrl-button"
                    title="Add new graph tile"
                    onClick={this.props.addGraphTile}
                >
                    +
                </span>
                <br />
                <span
                    className="ctrl-button save-icon"
                    title="Save\Load Layout"
                    onClick={this.onShowHideModal}
                >
                    🖫
                </span>
                <br />
                <span
                    className={`connection-indicator ${this.props.wsState}`}
                    title={`Connection status: ${this.props.wsState}`}
                >
                    🗘
                </span>
            </div>
        )
    }
}

export default SideControls
