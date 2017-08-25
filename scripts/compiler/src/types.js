"use strict";

const t = require("babel-types");
const evaluator = require("./evaluator");

const Types = {
  ANY: 'any',
  ANY_REQUIRED: 'any_isRequired',
  OBJECT: 'object',
  OBJECT_REQUIRED: 'object_isRequired',
  ARRAY: 'array',
  ARRAY_REQUIRED: 'array_isRequired',
  STRING: 'string',
  STRING_REQUIRED: 'string_isRequired',
  NUMBER: 'number',
  NUMBER_REQUIRED: 'number_isRequired',
  NODE: 'node',
  ELEMENT: 'element',
  BOOL: 'bool',
  BOOL_REQUIRED: 'bool_isRequired',
  FUNC: 'func',
  FUNC_REQUIRED: 'func_isRequired',
  SYMBOL: 'symbol',
  ONE_OF: 'one_of',
  INSTANCE_OF: 'instance_of',
  SHAPE: 'shape',
};

function convertAccessorsToNestedObject(accessors, propTypes, deepAccessors) {
  const keys = accessors ? Array.from(accessors.keys()) : [];
  const propKeys = propTypes ? Array.from(propTypes.keys()) : [];
  
  if (keys.length > 0 || propKeys.length > 0) {
    const object = {};
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const value = accessors.get(key);
      if (deepAccessors === true && value.accessors !== undefined && value.accessors.size > 0) {
        object[key] = convertAccessorsToNestedObject(value.accessors, propTypes, deepAccessors);
      } else {
        object[key] = Types.ANY;
      }
    }
    for (let i = 0; i < propKeys.length; i++) {
      const key = propKeys[i];
      let value = propTypes.get(key);

      if (value.type === 'FunctionCall') {
        switch (value.identifier) {
          case Types.ONE_OF: {
            const properties = value.args[0].properties;
            const newObj = {};
            Array.from(properties.values()).forEach(val => {
                newObj[val] = Types.ANY;
            });
            value = newObj;
            break;
          }
          case Types.SHAPE: {
            const properties = value.args[0].properties;
            const newObj = {};
            Array.from(properties.keys()).forEach(key => {
              const subValue = properties.get(key);
              if (typeof subValue === 'string') {
                newObj[key] = subValue;
              } else {
                // TODO
                throw new Error('A complex deeply nested shape() PropType was used. No support yet!');
              }
            });
            value = newObj;
            break;
          }
          default:
            value = Types.ANY;
        }
      } else if (value.type === 'ConditionalExpression' || value.type === 'AbstractUnknown') {
        // TODO
        // as we are inlikely to know this statically, let's assume any
        value = Types.ANY;
      } else if (value.type !== undefined) {
        debugger;
      }
      object[key] = value;
    }
    return object;
  }
  return null;
}

function convertNestedObjectToAst(object) {
  return t.objectExpression(
    Object.keys(object).map(key => {
      const value = object[key];
      if (typeof value === 'object') {
        return t.objectProperty(t.identifier(key), convertNestedObjectToAst(value));
      } else {
        let valueAst = t.nullLiteral();
        if (typeof value === 'string') {
          valueAst = t.stringLiteral(value);
        } else if (typeof value === 'number') {
          valueAst = t.numericLiteral(value);
        } else if (typeof value === 'boolean') {
          valueAst = t.booleanLiteral(value);
        } else {
          debugger;
        }
        return t.objectProperty(t.identifier(key), valueAst);
      }
    })
  );
}

function setAbstractPropsUsingNestedObject(ast, object, prefix, root) {
  const properties = ast.properties;
  Object.keys(object).forEach(key => {
    const value = object[key];
    const newPrefix = `${prefix}.${key}`;

    if (typeof value === 'object') {
      setAbstractPropsUsingNestedObject(properties.get(key).descriptor.value, value, newPrefix, false);
    } else {
      switch (value) {
        case Types.ARRAY_REQUIRED:
          properties.get(key).descriptor.value = evaluator.createAbstractArray(newPrefix);
          break;
        case Types.OBJECT_REQUIRED:
          properties.get(key).descriptor.value = evaluator.createAbstractObject(newPrefix);
          break;
        case Types.NUMBER_REQUIRED:
          properties.get(key).descriptor.value = evaluator.createAbstractNumber(newPrefix);
          break;
        case Types.STRING_REQUIRED:
          properties.get(key).descriptor.value = evaluator.createAbstractString(newPrefix);
          break;
        case Types.FUNC_REQUIRED:
          properties.get(key).descriptor.value = evaluator.createAbstractFunction(newPrefix);
          break;
        case Types.BOOL_REQUIRED:
          properties.get(key).descriptor.value = evaluator.createAbstractBoolean(newPrefix);
          break;
        default: {
          properties.get(key).descriptor.value = evaluator.createAbstractUnknown(newPrefix);
        }
      }
    }
  });
}

module.exports = {
  convertAccessorsToNestedObject: convertAccessorsToNestedObject,
  convertNestedObjectToAst: convertNestedObjectToAst,
  setAbstractPropsUsingNestedObject: setAbstractPropsUsingNestedObject,
  Types: Types,
};
