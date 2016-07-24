function noop() {}

function isType(type) {
    return function (obj) {
        return {}.toString.call(obj) == '[object ' + type + ']';
    }
}
const isObject = isType('Object');
const isString = isType('String');
const isArray = Array.isArray || isType('Array');
const isFunction = isType('Function');
const isUndefined = isType('Undefined');
const isNumber = function (val) {
    return typeof val === 'number';
};
const ODD_TAG_LIST = ['img', 'input', 'br', 'hr', 'param', 'meta', 'link'];
const isOddTag = new RegExp('^' + ODD_TAG_LIST.join('|') + '$');

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
    unique,
    isOddTag,
    noop
}
