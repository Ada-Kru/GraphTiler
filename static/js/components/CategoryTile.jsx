import React, { Component } from "react"
import removeKeys from "./removeKeys"

class CategoryTile extends Component {
    static defaultProps = { editing: false, onCancel: null }
    constructor(props) {
        super(props)
        this.state = {
            editing: this.props.editing,
            category: props.category,
            ...props.data
        }
        this.noSaveKeys = new Set(["editing"])

        this.currentCategory = props.category

        this.savedState = {}
        this.saveSnapshot()
        this.catForm = React.createRef()
    }

    componentDidUpdate = prevProps => {
        if (prevProps.data != this.props.data) {
            this.setState({ ...this.props.data })
        }
    }

    saveSnapshot = () => {
        this.savedState = removeKeys({ ...this.state }, this.noSaveKeys)
    }

    save = () => {
        if (!this.catForm.current.reportValidity()) {
            return
        }
        this.props.onRemove({ category: this.currentCategory })
        let data = removeKeys({ ...this.state }, this.noSaveKeys)
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

    onCatChange = evt => {
        this.setState({ category: evt.target.value })
    }

    onLineColorChange = evt => {
        this.setState({ borderColor: evt.target.value })
    }

    onLineTensionChange = evt => {
        this.setState({ lineTension: evt.target.value })
    }

    onPointColorChange = evt => {
        this.setState({ pointBackgroundColor: evt.target.value })
    }

    onPointStyleChange = evt => {
        this.setState({ pointStyle: evt.target.value })
    }

    onFillChange = evt => {
        this.setState({ fill: evt.target.value === "true" })
    }

    makeCfgBtn = () => {
        return (
            <span
                className="cat-tile-button"
                title="Modify category"
                onClick={this.modifyCategory}
            >
                ⛭
            </span>
        )
    }

    makeCloseBtn = (alignRight = false) => {
        let classname = "cat-tile-button red"
        if (alignRight) {
            classname += " right"
        }
        return (
            <span
                className={classname}
                title="Remove category"
                onClick={this.remove}
            >
                ✖
            </span>
        )
    }

    render() {
        if (this.state.editing) {
            return (
                <div className="cat-tile editing">
                    <form ref={this.catForm}>
                        <div className="cat-tile-options">
                            <span className="config-row">
                                <label>
                                    Category
                                    <input
                                        list="AvailableCats"
                                        defaultValue={this.state.category}
                                        onChange={this.onCatChange}
                                        autoFocus
                                        maxLength="100"
                                        required
                                    />
                                </label>
                            </span>
                            <span className="config-row">
                                <label>
                                    Line color
                                    <input
                                        type="color"
                                        value={this.state.borderColor}
                                        onChange={this.onLineColorChange}
                                    />
                                </label>
                            </span>
                            <span className="config-row">
                                <label>
                                    Line tension
                                    <input
                                        value={this.state.lineTension}
                                        onChange={this.onLineTensionChange}
                                        min="0"
                                        max="1"
                                        step="0.01"
                                        type="number"
                                    />
                                </label>
                            </span>
                            <span className="config-row">
                                <label>
                                    Point color
                                    <input
                                        type="color"
                                        value={this.state.pointBackgroundColor}
                                        onChange={this.onPointColorChange}
                                    />
                                </label>
                            </span>
                            <span className="config-row">
                                <label>
                                    Point style
                                    <select
                                        value={this.state.pointStyle}
                                        onChange={this.onPointStyleChange}
                                    >
                                        <option value="circle">Circle</option>
                                        <option value="cross">Cross</option>
                                        <option value="crossRot">Rotated Cross</option>
                                        <option value="dash">Dash</option>
                                        <option value="line">Line</option>
                                        <option value="rect">Rectangle</option>
                                        <option value="rectRounded">Rounded Rectangle</option>
                                        <option value="rectRot">Rotated Rectangle</option>
                                        <option value="star">Star</option>
                                        <option value="triangle">Triangel</option>
                                    </select>
                                </label>
                            </span>
                            <span className="config-row">
                                <label>
                                    Fill
                                    <select
                                        value={this.state.fill.toString()}
                                        onChange={this.onFillChange}
                                    >
                                        <option value="true">True</option>
                                        <option value="false">False</option>
                                    </select>
                                </label>
                            </span>
                        </div>
                    </form>
                    <span className="cat-tile-footer">
                        <button onClick={this.save}>Save</button>
                        <button onClick={this.cancel}>Cancel</button>
                    </span>
                </div>
            )
        } else {
            return (
                <fieldset className="cat-tile">
                    <legend>
                        {this.state.category + " "}
                        {this.makeCfgBtn()} {this.makeCloseBtn(true)}
                    </legend>
                    <div className="cat-tile-options">
                        <span className="config-row">
                            <label>
                                Line color
                                <input
                                    type="color"
                                    value={this.state.borderColor}
                                    onChange={this.onLineColorChange}
                                    disabled={true}
                                />
                            </label>
                        </span>
                    </div>
                </fieldset>
            )
        }
    }
}

export default CategoryTile
