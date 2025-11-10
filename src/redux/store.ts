import { combineReducers } from "redux";
import { configureStore } from "@reduxjs/toolkit";
import { authReducer } from "./reducers/authReducers";

const reducers = {
    auth: authReducer,
};

export const rootReducer = combineReducers(reducers);

export function makeStore(preloadedState:any) {
    return configureStore({
        reducer: rootReducer,
        preloadedState,

        devTools: process.env.NODE_ENV !== "production",
    });
}

// Backward compatibility in case some places import default store
const store = makeStore;
export default store;