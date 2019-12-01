import React, { Component } from "react"

class CategoryTile extends Component {
    static defaultProps = { editing: false }
    constructor(props) {
        super(props)
        this.state = {
            editing: this.props.editing,
            category: props.category,
            lineColor: props.data.lineColor,
        }
        this.savedState = {}
        this.saveState()
    }

    save = () => {
        let data = {
            category: this.state.category,
            lineColor: this.state.lineColor,
        }
        this.props.onCatSave(data)
        this.setState({ editing: false })
    }

    cancel = () => {
        this.setState({ editing: false, ...this.savedState })
    }

    saveState = () => {
        this.savedState = {
            category: this.state.category,
            lineColor: this.state.lineColor,
        }
    }

    modifyCategory = () => {
        if (!this.state.editing) {
            this.saveState()
            this.setState({ editing: true })
        }
    }

    onChangeCat = evt => {
        this.setState({ category: evt.target.value })
    }

    onChangeLineColor = evt => {
        this.setState({ lineColor: evt.target.value })
    }

    render() {
        if (this.state.editing) {
            return (
                <div className="cat-tile editing">
                    <div className="cat-tile-header">
                        <span
                            className="cat-tile-button"
                            title="Modify category"
                            onClick={this.modifyCategory}
                        >
                            ⛭
                        </span>
                        <span
                            className="cat-tile-button red"
                            title="Remove category"
                            onClick={this.props.removeCategory}
                        >
                            ✖
                        </span>
                    </div>
                    <div className="cat-tile-options">
                        <span className="config-row">
                            <label>
                                Category
                                <input
                                    list="AvailableCats"
                                    defaultValue={this.state.category}
                                    onChange={this.onChangeCat}
                                />
                            </label>
                        </span>
                        <span className="config-row">
                            <label>
                                Line color
                                <input
                                    type="color"
                                    defaultValue={this.state.lineColor}
                                    onChange={this.onChangeLineColor}
                                />
                            </label>
                        </span>
                    </div>
                    <span className="cat-tile-footer">
                        <button onClick={this.save}>Save</button>
                        <button onClick={this.cancel}>Cancel</button>
                    </span>
                </div>
            )
        } else {
            return (
                <div className="cat-tile">
                    <div className="cat-tile-header">
                        <span
                            className="cat-tile-button"
                            title="Modify category"
                            onClick={this.modifyCategory}
                        >
                            ⛭
                        </span>
                        <span
                            className="cat-tile-button red"
                            title="Remove category"
                            onClick={this.props.removeCategory}
                        >
                            ✖
                        </span>
                    </div>
                    <div className="cat-tile-options">
                        <span className="config-row">
                            <label>
                                Category
                                <input
                                    defaultValue={this.state.category}
                                    disabled={true}
                                />
                            </label>
                        </span>
                        <span className="config-row">
                            <label>
                                Line color
                                <input
                                    type="color"
                                    defaultValue={this.state.lineColor}
                                    onChange={this.onChangeLineColor}
                                    disabled={true}
                                />
                            </label>
                        </span>
                    </div>
                </div>
            )
        }
    }
}

export default CategoryTile
