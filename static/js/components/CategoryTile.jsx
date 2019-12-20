import React, { Component } from "react"
import { connect } from "react-redux"
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
        this.catInput = React.createRef()
    }

    componentDidUpdate = prevProps => {
        if (prevProps.data != this.props.data) {
            this.setState({ ...this.props.data })
        }
    }

    _isRegistered = () => {
        return this.props.graphs.hasOwnProperty(this.props.graphId)
    }

    _getCatIds = () => {
        return this._isRegistered()
            ? this.props.graphs[this.props.graphId].categories
            : []
    }

    _getGraphCatNames = () => {
        let catNames = []
        for (let catId of this._getCatIds()) {
            catNames.push(this.props.categories[catId].category)
        }
        return catNames
    }

    saveSnapshot = () => {
        this.savedState = removeKeys({ ...this.state }, this.noSaveKeys)
    }

    save = () => {
        if (!this.catForm.current.reportValidity()) return
        let cats = this._getGraphCatNames(),
            catInUse =
                cats.includes(this.state.category) &&
                !cats.includes(this.currentCategory)
        if (catInUse) {
            this.catInput.current.setCustomValidity("Category already exists!")
            return
        }
        this.props.onRemove({ category: this.currentCategory })
        let data = removeKeys({ ...this.state }, this.noSaveKeys)
        this.props.onSave(data)
        this.currentCategory = this.state.category
        this.setState({ editing: false })
    }

    onSaveButtonBlur = () => {
        this.catInput.current.setCustomValidity("")
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
                            <fieldset>
                                <legend>Name</legend>
                                <div className="fieldset-wrapper">
                                <label>
                                    Category
                                    <input
                                        className="gt-input"
                                        list="AvailableCats"
                                        type="text"
                                        defaultValue={this.state.category}
                                        onChange={this.onFormChange}
                                        ref={this.catInput}
                                        name="category"
                                        autoFocus
                                        maxLength="100"
                                        required
                                    />
                                </label>
                                <label>
                                    Label
                                    <input
                                        className="gt-input"
                                        type="text"
                                        defaultValue={this.state.label}
                                        onChange={this.onFormChange}
                                        name="label"
                                        maxLength="100"
                                        required
                                    />
                                </label>
                                </div>
                            </fieldset>
                            <fieldset>
                                <legend>Line</legend>
                                <div className="fieldset-wrapper">
                                <label>
                                    Line color
                                    <input
                                        className="gt-input"
                                        type="color"
                                        value={this.state.borderColor}
                                        onChange={this.onFormChange}
                                        name="borderColor"
                                    />
                                </label>
                                <label>
                                    Line width
                                    <input
                                        className="gt-input"
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
                                        className="gt-input"
                                        value={this.state.lineTension}
                                        onChange={this.onFormChange}
                                        name="lineTension"
                                        min="0"
                                        max="1"
                                        step="0.01"
                                        type="number"
                                    />
                                </label>
                                </div>
                            </fieldset>
                            <fieldset>
                                <legend>Points</legend>
                                <div className="fieldset-wrapper">
                                <label>
                                    Point border
                                    <input
                                        className="gt-input"
                                        type="color"
                                        value={this.state.pointBorderColor}
                                        onChange={this.onFormChange}
                                        name="pointBorderColor"
                                    />
                                </label>
                                <label>
                                    Point fill
                                    <input
                                        className="gt-input"
                                        type="color"
                                        value={this.state.pointBackgroundColor}
                                        onChange={this.onFormChange}
                                        name="pointBackgroundColor"
                                    />
                                </label>
                                <label>
                                    Point size
                                    <input
                                        className="gt-input"
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
                                        className="gt-input"
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
                                </div>
                            </fieldset>
                            <fieldset>
                                <legend>Fill</legend>
                                <div className="fieldset-wrapper">
                                <label>
                                    Fill
                                    <select
                                        className="gt-input"
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
                                        className="gt-input"
                                        type="color"
                                        value={this.state.backgroundColor}
                                        onChange={this.onFormChange}
                                        name="backgroundColor"
                                    />
                                </label>
                                </div>
                            </fieldset>
                        </div>
                    </form>
                    <span className="cat-tile-footer">
                        <button
                            onClick={this.save}
                            onBlur={this.onSaveButtonBlur}
                        >
                            Save
                        </button>
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
                    </div>
                </fieldset>
            )
        }
    }
}

const mapStateToProps = state => {
    return {
        graphs: state.graphs,
        categories: state.categories,
    }
}

export default connect(mapStateToProps)(CategoryTile)
