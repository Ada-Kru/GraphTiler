import React, { Component } from "react"
import ReactModal from "react-modal"

const POST_OPTIONS = {
    method: "POST",
    headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
    },
}

ReactModal.defaultStyles.overlay.backgroundColor = "#222"
ReactModal.defaultStyles.content.backgroundColor = "#333"

class SideControls extends Component {
    constructor(props) {
        super(props)
        this.state = {
            showModal: false,
            loading: true,
            error: false,
            saveModalName: "",
            layouts: [],
        }
    }

    fetchLayouts = () => {
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
    }

    onShowHideModal = () => {
        if (!this.state.showModal) {
            this.setState({ showModal: true })
            this.fetchLayouts()
        } else {
            this.setState({
                showModal: false,
                loading: true,
                error: false,
                layouts: [],
            })
        }
    }

    onModalFormChange = evt => {
        this.setState({ [evt.target.name]: evt.target.value })
    }

    onSaveLayout = () => {
        if (this.state.saveModalName === "") {
            return
        }
        let layout = JSON.stringify({
            name: this.state.saveModalName,
            data: {},
        })
        fetch("/layout/add", { ...POST_OPTIONS, body: layout })
            .then(response => {
                return response.json()
            })
            .then(json => {
                if (!json.errors) {
                    this.setState({ saveModalName: "" })
                    this.fetchLayouts()
                }
            })
            .catch(e => {
                this.setState({ loading: false, error: true })
            })
    }

    onLoadLayout = name => {
        let layout = JSON.stringify({ name: name })
        fetch("/layout/get", { ...POST_OPTIONS, body: layout })
            .then(response => { return response.json() })
            .then(json => {
                if (!json.errors) {
                    // -----------------------------------json == LOADED DATA
                }
            })
            .catch(e => {
                this.setState({ loading: false, error: true })
            })
    }

    onDeleteLayout = name => {
        let layout = JSON.stringify({ name: name })
        fetch("/layout/delete", { ...POST_OPTIONS, body: layout })
            .then(response => { return response.json() })
            .then(json => {
                if (!json.errors) {
                    this.fetchLayouts()
                }
            })
            .catch(e => {
                this.setState({ loading: false, error: true })
            })
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
                            name="saveModalName"
                            value={this.state.saveName}
                            onChange={this.onModalFormChange}
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
