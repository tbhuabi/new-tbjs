function noop() {}

function isType(type) {
    return function (obj) {
        return {}.toString.call(obj) == '[object ' + type + ']';
    }
};
let isObject = isType('Object');
let isString = isType('String');
let isArray = Array.isArray || isType('Array');
let isFunction = isType('Function');
let isUndefined = isType('Undefined');
let isNumber = function (val) {
    return typeof val === 'number';
};

function isEmpty(str) {
    return /^[\s\t\n\r\v]$/gm.test(str);
}

function trim(str) {
    return str.replace(/^\s+|\s+$/g, '');
}

function forEach(arr, fn) {
    for (let i = 0, len = arr.length; i < len; i++) {
        fn(arr[i]);
    }
}

function unique(arr) {
    if (arr.length < 2) {
        return arr;
    }
    let result = [arr[0]];
    let noRepeat = true;
    for (let i = 1, len = arr.length; i < len; i++) {
        for (let j = 0, len2 = result.length; j < len2; j++) {
            if (result[j] === arr[i]) {
                noRepeat = false;
            }
        }
        if (noRepeat) {
            result.push(arr[i]);
            noRepeat = true;
        }
    }
    return result;
}

export {
    isObject,
    isString,
    isArray,
    isFunction,
    isUndefined,
    isNumber,
    isEmpty,
    trim,
    forEach,
    unique
}
