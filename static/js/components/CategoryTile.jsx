import React, { Component } from "react"
import removeKeys from "./removeKeys"

class CategoryTile extends Component {
    static defaultProps = { editing: false, onCancel: null }
    constructor(props) {
        super(props)
        this.state = {
            editing: this.props.editing,
            category: props.category,
            ...props.data,
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

    onFormChange = evt => {
        this.setState({ [evt.target.name]: evt.target.value })
    }

    onFormChangeBoolStr = evt => {
        this.setState({ [evt.target.name]: evt.target.value === "true" })
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
                                        onChange={this.onFormChange}
                                        name="category"
                                        autoFocus
                                        maxLength="100"
                                        required
                                    />
                                </label>
                                <label>
                                    Label
                                    <input
                                        defaultValue={this.state.label}
                                        onChange={this.onFormChange}
                                        name="label"
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
                                        onChange={this.onFormChange}
                                        name="borderColor"
                                    />
                                </label>
                            </span>
                            <span className="config-row">
                                <label>
                                    Line width
                                    <input
                                        value={this.state.borderWidth}
                                        onChange={this.onFormChange}
                                        name="borderWidth"
                                        min="1"
                                        max="20"
                                        type="number"
                                    />
                                </label>
                                <label>
                                    Roundness
                                    <input
                                        value={this.state.lineTension}
                                        onChange={this.onFormChange}
                                        name="lineTension"
                                        min="0"
                                        max="1"
                                        step="0.01"
                                        type="number"
                                    />
                                </label>
                            </span>
                            <span className="config-row">
                                <label>
                                    Point border
                                    <input
                                        type="color"
                                        value={this.state.pointBorderColor}
                                        onChange={this.onFormChange}
                                        name="pointBorderColor"
                                    />
                                </label>
                                <label>
                                    Point fill
                                    <input
                                        type="color"
                                        value={this.state.pointBackgroundColor}
                                        onChange={this.onFormChange}
                                        name="pointBackgroundColor"
                                    />
                                </label>
                            </span>
                            <span className="config-row">
                                <label>
                                    Point size
                                    <input
                                        value={this.state.pointRadius}
                                        onChange={this.onFormChange}
                                        name="pointRadius"
                                        min="0"
                                        max="20"
                                        type="number"
                                    />
                                </label>
                                <label>
                                    Point style
                                    <select
                                        value={this.state.pointStyle}
                                        onChange={this.onFormChange}
                                        name="pointStyle"
                                    >
                                        <option value="circle">Circle</option>
                                        <option value="cross">Cross</option>
                                        <option value="crossRot">X</option>
                                        <option value="dash">Dash</option>
                                        <option value="line">Line</option>
                                        <option value="rect">Square</option>
                                        <option value="rectRounded">
                                            Rounded Square
                                        </option>
                                        <option value="rectRot">Diamond</option>
                                        <option value="star">Star</option>
                                        <option value="triangle">
                                            Triangle
                                        </option>
                                    </select>
                                </label>
                            </span>
                            <span className="config-row">
                                <label>
                                    Fill
                                    <select
                                        value={this.state.fill.toString()}
                                        onChange={this.onFormChangeBoolStr}
                                        name="fill"
                                    >
                                        <option value="true">True</option>
                                        <option value="false">False</option>
                                    </select>
                                </label>
                                <label>
                                    Fill color
                                    <input
                                        type="color"
                                        value={this.state.backgroundColor}
                                        onChange={this.onFormChange}
                                        name="backgroundColor"
                                    />
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
                                    disabled={true}
                                />
                            </label>
                            <label>
                                Point color
                                <input
                                    type="color"
                                    value={this.state.pointBorderColor}
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
