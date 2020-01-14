import React, { Component } from "react"
import ReactModal from "react-modal"

ReactModal.defaultStyles.overlay.backgroundColor = '#222';
ReactModal.defaultStyles.content.backgroundColor = '#333';

class SideControls extends Component {
    constructor(props) {
        super(props)
        this.state = { showModal: false }
    }

    onShowModal = () => {
        this.setState({ showModal: !this.state.showModal })
    }

    render() {
        return (
            <div className="side-controls">
                <ReactModal
                    isOpen={this.state.showModal}
                    contentLabel="Minimal Modal Example"
                >
                    <button onClick={this.onShowModal}>Close Modal</button>
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
                    onClick={this.onShowModal}
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
