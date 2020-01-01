const removeKeys = (obj, remove) => {
    for (let key of remove.keys()) {
        delete obj[key]
    }
    return obj
}

export default removeKeys
