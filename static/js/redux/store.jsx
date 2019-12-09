import { createStore } from 'redux'
import appReducer from "./App/appReducer"

const store = createStore(appReducer)

export default store
