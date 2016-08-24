'use strict';

const cloneDeep = require('lodash').cloneDeep;
const setValueOn = require('../builder-utilities').setValueOn;

const createParameterBuilder = (parameter) => {
    const builder = {
        build: () => cloneDeep(parameter),
        withNumberInPathNamed: (name) => builder
            .withName(name)
            .withInPath()
            .withTypeNumber(),
        withName: (name) => createParameterBuilder(setValueOn(parameter, 'name', name)),
        withInPath: () => {
            const newParameterWithPath = setValueOn(parameter, 'in', 'path');
            const newParameterWithPathAndRequired = setValueOn(newParameterWithPath, 'required', true);

            return createParameterBuilder(newParameterWithPathAndRequired);
        },
        withTypeArrayOfNumber: () => {
            const newParameterWithTypeArray = setValueOn(parameter, 'type', 'array');
            const newParameterWithTypeArrayAndItemsNumber =
                setValueOn(newParameterWithTypeArray, 'items', {type: 'number'});

            return createParameterBuilder(newParameterWithTypeArrayAndItemsNumber);
        },
        withTypeBoolean: () => createParameterBuilder(setValueOn(parameter, 'type', 'boolean')),
        withTypeInteger: () => createParameterBuilder(setValueOn(parameter, 'type', 'integer')),
        withTypeNumber: () => createParameterBuilder(setValueOn(parameter, 'type', 'number')),
        withTypeString: () => createParameterBuilder(setValueOn(parameter, 'type', 'string'))
    };

    return builder;
};

module.exports = createParameterBuilder({
    name: 'default-name',
    in: 'path',
    required: false,
    type: 'number'
});
