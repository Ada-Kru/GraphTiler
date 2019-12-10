import { createStore, applyMiddleware } from 'redux'
import { composeWithDevTools } from 'redux-devtools-extension';
import appReducer from "./App/appReducer"

const store = createStore(appReducer, composeWithDevTools(applyMiddleware()))

export default store
