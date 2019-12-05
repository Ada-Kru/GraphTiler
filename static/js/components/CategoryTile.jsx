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
        this.catForm = React.createRef()
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
        if (!this.catForm.current.reportValidity()) {
            return
        }
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
                                        onChange={this.onChangeCat}
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
                                        value={this.state.lineColor}
                                        onChange={this.onChangeLineColor}
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
                                    value={this.state.lineColor}
                                    onChange={this.onChangeLineColor}
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
