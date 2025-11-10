'use client';
import React from 'react'
import { Provider } from "react-redux";
import  { makeStore } from "@/redux/store";

const StoreProvider = ({ children, initialState }:{children:React.ReactNode,initialState?:any}) => {
    const preloadedStore = React.useMemo(() => makeStore(initialState), [initialState]);
    return (
        <Provider store={preloadedStore}>
            {children}
        </Provider>
    )
}

export default StoreProvider