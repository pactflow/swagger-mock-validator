'use strict';

const setValueOn = require('./context/builder-utilities').setValueOn;
const cloneDeep = require('lodash').cloneDeep;

const createContext = (state) => {
    const context = {
        getPactFileName: () => cloneDeep(state.pactFileName),
        getPactInteractionDescription: () => cloneDeep(state.pactInteractionDescription),
        getPactInteractionState: () => cloneDeep(state.pactInteractionState),
        getPactLocation: () => cloneDeep(state.pactLocation),
        getPactValue: () => cloneDeep(state.pactValue),
        getSource: () => cloneDeep(state.source),
        getSwaggerFileName: () => cloneDeep(state.swaggerFileName),
        getSwaggerLocation: () => cloneDeep(state.swaggerLocation),
        getSwaggerPathName: () => cloneDeep(state.swaggerPathName),
        getSwaggerPathMethod: () => cloneDeep(state.swaggerPathMethod),
        getSwaggerValue: () => cloneDeep(state.swaggerValue),
        pushPactLocation: (partialPactLocation) =>
            context.setPactLocation(`${state.pactLocation}.${partialPactLocation}`),
        pushPactLocationArrayIndex: (index) =>
            context.setPactLocation(`${state.pactLocation}[${index}]`),
        pushSwaggerLocation: (partialSwaggerLocation) =>
            context.setSwaggerLocation(`${state.swaggerLocation}.${partialSwaggerLocation}`),
        pushSwaggerLocationArrayIndex: (index) =>
            context.setSwaggerLocation(`${state.swaggerLocation}[${index}]`),
        setPactFileName: (pactFileName) => createContext(setValueOn(state, 'pactFileName', pactFileName)),
        setPactInteractionDescription: (pactInteractionDescription) =>
            createContext(setValueOn(state, 'pactInteractionDescription', pactInteractionDescription)),
        setPactInteractionState: (pactInteractionState) =>
            createContext(setValueOn(state, 'pactInteractionState', pactInteractionState || '[none]')),
        setPactLocation: (pactLocation) => createContext(setValueOn(state, 'pactLocation', pactLocation)),
        setPactValue: (pactValue) => createContext(setValueOn(state, 'pactValue', pactValue)),
        setSource: (source) => createContext(setValueOn(state, 'source', source)),
        setSwaggerFileName: (swaggerFileName) => createContext(setValueOn(state, 'swaggerFileName', swaggerFileName)),
        setSwaggerPathName: (swaggerPathName) => createContext(setValueOn(state, 'swaggerPathName', swaggerPathName)),
        setSwaggerPathMethod: (swaggerPathMethod) =>
            createContext(setValueOn(state, 'swaggerPathMethod', swaggerPathMethod)),
        setSwaggerLocation: (swaggerLocation) => createContext(setValueOn(state, 'swaggerLocation', swaggerLocation)),
        setSwaggerValue: (swaggerValue) => createContext(setValueOn(state, 'swaggerValue', swaggerValue))
    };

    return context;
};

module.exports = createContext({})
    .setPactFileName(null)
    .setPactInteractionDescription(null)
    .setPactInteractionState(null)
    .setPactLocation(null)
    .setPactValue(null)
    .setSource(null)
    .setSwaggerFileName(null)
    .setSwaggerPathName(null)
    .setSwaggerPathMethod(null)
    .setSwaggerLocation(null)
    .setSwaggerValue(null);
