import React, { Component } from "react"

class CategoryTile extends Component {
    static defaultProps = { editing: false, onCancel: null }
    constructor(props) {
        super(props)
        this.state = {
            editing: this.props.editing,
            category: props.category,
            lineColor: props.data.lineColor,
        }

        this.currentCategory = props.category

        this.savedState = {}
        this.saveSnapshot()
    }

    componentDidUpdate = prevProps => {
        if (prevProps.data != this.props.data) {
            this.setState({ lineColor: this.props.data.lineColor })
        }
    }

    saveSnapshot = () => {
        this.savedState = {
            category: this.state.category,
            lineColor: this.state.lineColor,
        }
    }

    save = () => {
        this.props.onRemove({ category: this.currentCategory })
        let data = {
            category: this.state.category,
            lineColor: this.state.lineColor,
        }
        this.props.onSave(data)
        this.currentCategory = this.state.category
        this.setState({ editing: false })
    }

    cancel = () => {
        this.props.onCancel()
        this.setState({ editing: false, ...this.savedState })
    }

    remove = () => {
        this.props.onRemove({ category: this.state.category })
    }

    modifyCategory = () => {
        if (!this.state.editing) {
            this.saveSnapshot()
            this.setState({ editing: true })
        }
    }

    onChangeCat = evt => {
        this.setState({ category: evt.target.value })
    }

    onChangeLineColor = evt => {
        this.setState({ lineColor: evt.target.value })
    }

    makeHeader = () => {
        return this.state.editing ? null :
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
                onClick={this.remove}
            >
                ✖
            </span>
        </div>
    }

    render() {
        if (this.state.editing) {
            return (
                <div className="cat-tile editing">
                    {this.makeHeader()}
                    <div className="cat-tile-options">
                        <span className="config-row">
                            <label>
                                Category
                                <input
                                    list="AvailableCats"
                                    defaultValue={this.state.category}
                                    onChange={this.onChangeCat}
                                    autoFocus
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
                        <button onClick={this.save}>Save</button>
                        <button onClick={this.cancel}>Cancel</button>
                    </span>
                </div>
            )
        } else {
            return (
                <div className="cat-tile">
                    {this.makeHeader()}
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
