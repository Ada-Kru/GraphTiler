import React, { Component } from "react"

class CategoryTile extends Component {
    constructor(props) {
        super(props)
        this.state = {
            editing: false,
            category: props.item.category,
            lineColor: "#FFF",
        }
    }

    modifyCategory = () => {
        if (!this.state.editing) {
            this.setState({ editing: true })
        }
    }

    onChangeLineColor = evt => {
        this.setState({ lineColor: evt.data })
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
                                    value={this.state.category}
                                />
                            </label>
                        </span>
                        <span className="config-row">
                            <label>
                                Line color
                                <input
                                    type="color"
                                    value={this.state.lineColor}
                                    onChange={this.onChangeLineColor}
                                />
                            </label>
                        </span>
                    </div>
                    <span className="cat-tile-footer">
                        <button>Save</button>
                        <button>Cancel</button>
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
                                <label>{this.props.item.category}</label>
                            </label>
                        </span>
                        <span className="config-row">
                            <label>
                                Line color
                                <input
                                    type="color"
                                    value={this.state.lineColor}
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
