import {
    isArray,
    isUndefined,
    unique,
    trim
}
from './public';

import {
    NODE_TYPE_ELEMENT,
    NODE_TYPE_TEXT,
    NODE_TYPE_COMMENT,
    NODE_TYPE_DOCUMENT,
    NODE_TYPE_DOCUMENTFRAGMENT
}
from './variables';

class RootElement {
    constructor() {
        this.$DOCTYPE = 'VIRTUAL_DOM';
    }

    getInnerHtml() {
        if (this.innerHTML) {
            return this.innerHTML;
        } else if (this.nodeType === NODE_TYPE_TEXT || this.nodeType === NODE_TYPE_COMMENT) {
            return this.textContent;
        }
        let innerHTML = '';
        if (this.childNodes) {
            for (let i = 0, len = this.childNodes.length; i < len; i++) {
                innerHTML += this.childNodes[i].getOuterHtml();
            }
        }
        this.innerHTML = innerHTML;
        return innerHTML;
    }
    getOuterHtml() {
        if (this.outerHTML) {
            return this.outerHTML;
        } else if (this.nodeType === NODE_TYPE_TEXT) {
            return this.textContent;
        } else if (this.nodeType === NODE_TYPE_COMMENT) {
            return '<!--' + this.textContent + '-->';
        }

        let getAttributeHtml = function (attributes) {
            let attrbutesList = [];
            for (let i = 0, len = attributes.length; i < len; i++) {
                let item = attributes[i];
                let attr = item.name;
                if (attr === 'className') {
                    attr = 'class';
                }
                if (item.value !== null && item.value !== undefined) {
                    if (item.value.indexOf('"') === -1) {
                        attr = attr + '="' + item.value + '"';
                    } else {
                        attr = attr + "='" + item.value + "'";
                    }
                }
                attrbutesList.push(attr);
            }
            return attrbutesList.join(' ');
        }

        let getChildNodesHtml = function (obj) {
            let html = '';
            for (let i = 0, len = obj.childNodes.length; i < len; i++) {
                html += obj.childNodes[i].getOuterHtml();
            }
            return html;
        }


        let outerHtml = '';
        if (this.nodeType === NODE_TYPE_ELEMENT) {
            let tagName = this.tagName.toLowerCase();
            let attrHtml = getAttributeHtml(this.attributes);
            if (ODD_TAG_LIST.indexOf(tagName) === -1) {
                outerHtml = '<' + tagName + (attrHtml ? ' ' + attrHtml : '') + '>' + getChildNodesHtml(this) + '</' + tagName + '>';
            } else {
                outerHtml = '<' + tagName + ' ' + attrHtml + '>';
            }
        } else if (this.nodeType === NODE_TYPE_DOCUMENT) {
            outerHtml = getChildNodesHtml(this);
        }

        this.outerHTML = outerHtml;
        return outerHtml;
    }
    getInnerText() {
        if (this.nodeType === NODE_TYPE_TEXT) {
            return this.textContent;
        } else if (this.nodeType === NODE_TYPE_COMMENT) {
            return;
        }
        let text = '';
        if (this.childNodes) { //单标签没有子级
            for (let i = 0, len = this.childNodes.length; i < len; i++) {
                text += this.childNodes[i].getInnerText() || '';
            }
        }
        this.innerText = text;
        return text;
    }
}

class ElementEvent extends RootElement {
    addEventListener(eventType, fn, useCapture) {
        useCapture = !!useCapture;
        eventType = eventType.toLowerCase();
        if (!isArray(this.eventListener[eventType])) {
            this.eventListener[eventType] = [];
        }
        this.eventListener[eventType].push({
            fn: fn,
            useCapture: useCapture
        });
    }
    removeEventListener(eventType, fn) {
        if (isArray(this.eventListener[eventType])) {
            for (let i = 0, len = this.eventListener.length; i < len; i++) {
                if (this.eventListener[i].fn === fn) {
                    this.eventListener.splice(i, 1);
                    return;
                }
            }
        }
    }
}
class Element extends ElementEvent {
    $refresh() {
        this.innerHTML = this.outerHTML = this.innerText = '';
        this.getOuterHtml();
        this.getInnerHtml();
        this.getInnerText();
        if (this.parentNode) {
            this.parentNode.$refresh();
        }
    }
    setInnerHtml(arg) {
        let newNodeElements = new DocumentElement(arg);
        this.childNodes = [];
        this.children = [];
        for (let i = 0, len = newNodeElements.childNodes.length; i < len; i++) {
            this.appendChild(newNodeElements.childNodes[i]);
        }
        newNodeElements = null;
        this.$refresh();
    }
    setAttribute(attributes, value) {
        let item;
        for (let i = 0, len = this.attributes.length; i < len; i++) {
            if (this.attributes[i].name === attributes) {
                item = this.attributes[i];
                break;
            }
        }
        if (!item) {
            item = {};
            this.attributes.push(item);
        }
        item.name = attributes;
        if (!isUndefined(value)) {
            item.value = value;
        }
        this.className = this.getAttribute('class');
        this.classList = this.className.match(/\S+/g) || [];
        this.id = this.getAttribute('id');
        this.$refresh();
    }
    getAttribute(key) {
        for (let i = 0, len = this.attributes.length; i < len; i++) {
            if (this.attributes[i].name === key) {
                return this.attributes[i].value;
            }
        }
        return '';
    }
    hasAttribute(key) {
        for (let i = 0, len = this.attributes.length; i < len; i++) {
            if (this.attributes[i].name === key) {
                return true;
            }
        }
        return false;
    }
    removeAttribute(key) {
        for (let i = 0, len = this.attributes.length; i < len; i++) {
            if (this.attributes[i].name === key) {
                this.attributes.splice(i, 1);
                if (key === 'class') {
                    this.className = '';
                    this.classList = [];
                } else if (key === 'id') {
                    this.id = '';
                }
                break;
            }
        }
        this.$refresh();
    }
    querySelectorAll(selector) {
        selector = ' ' + trim(selector);
        let _this = this;
        let elements = [];



        let ALL_SELECTOR_REG = /^\s+\*?(?!>|\[|:first-child|:last-child|\+)/;
        let TAG_SELECTOR_REG = /^(\w+(?:-\w+)*)/;
        let ID_SELECTOR_REG = /^#(\w+(?:-\w+)*)/;
        let CLASSNAME_SELECTOR_REG = /^\.(\w+(?:-\w+)*)/;
        let ATTRIBUTE_SELECTOR_REG = /^\s*\[\s*(\w+(?:-\w+)*)(?:\s*=\s*(['"]?)([^\2]*)\2?\s*)?\]/;
        let CHILDREN_SELECTOR_RGE = /^\s*>/;
        let FIRST_SELECTOR_REG = /^\s*:first-child\b/;
        let LAST_SELECTOR_REG = /^\s*:last-child\b/;
        let SIBLINGS_SELECTOR_REG = /^\+\s*/;


        function selectDistributor(selector, context) {

            let parentElements = [];
            let nextSelector = '';
            for (let i = 0, len = context.length; i < len; i++) {
                let currentElement = context[i];
                if (ALL_SELECTOR_REG.test(selector)) {
                    nextSelector = selector.replace(ALL_SELECTOR_REG, function () {
                        currentElement.getElementsByTagName('*').filter(function (item) {
                            parentElements.push(item);
                        })
                        return '';
                    })
                } else if (TAG_SELECTOR_REG.test(selector)) {
                    nextSelector = selector.replace(TAG_SELECTOR_REG, function (selector, tagName) {
                        if (currentElement.tagName === tagName.toUpperCase()) {
                            parentElements.push(currentElement);
                        }
                        return '';
                    })
                } else if (ID_SELECTOR_REG.test(selector)) {
                    nextSelector = selector.replace(ID_SELECTOR_REG, function (selector, id) {
                        if (currentElement.id === id) {
                            parentElements.push(currentElement);
                        }
                        return '';
                    })
                } else if (CLASSNAME_SELECTOR_REG.test(selector)) {
                    nextSelector = selector.replace(CLASSNAME_SELECTOR_REG, function (selector, className) {
                        let reg = new RegExp('(^|\\s+)' + className + '(\\s+|$)');
                        if (reg.test(currentElement.className)) {
                            parentElements.push(currentElement);
                        }
                        return '';
                    })
                } else if (ATTRIBUTE_SELECTOR_REG.test(selector)) {
                    nextSelector = selector.replace(ATTRIBUTE_SELECTOR_REG, function (selector, propName, _, propValue) {
                        if (propValue) {
                            if (currentElement.getAttribute(propName) === propValue) {
                                parentElements.push(currentElement);
                            }
                        } else {
                            if (currentElement.hasAttribute(propName)) {
                                parentElements.push(currentElement);
                            }
                        }
                        return '';
                    })
                } else if (CHILDREN_SELECTOR_RGE.test(selector)) {
                    nextSelector = selector.replace(CHILDREN_SELECTOR_RGE, function () {
                        if (!currentElement.children) return '';
                        for (let j = 0, len = currentElement.children.length; j < len; j++) {
                            parentElements.push(currentElement.children[j]);
                        }
                        return '';
                    })
                } else if (FIRST_SELECTOR_REG.test(selector)) {
                    nextSelector = selector.replace(FIRST_SELECTOR_REG, function () {
                        parentElements.push(currentElement);
                        i = len;
                        return '';
                    })
                } else if (LAST_SELECTOR_REG.test(selector)) {
                    nextSelector = selector.replace(LAST_SELECTOR_REG, function () {
                        parentElements.push(context[len - 1]);
                        i = len;
                        return '';
                    })
                } else if (SIBLINGS_SELECTOR_REG.test(selector)) {
                    nextSelector = selector.replace(SIBLINGS_SELECTOR_REG, function () {
                        let siblings = currentElement.parentNode.children;
                        siblings.filter(function (item) {
                            if (item !== currentElement) {
                                parentElements.push(item);
                            }
                        })
                        return '';
                    })
                }


            }
            if (selector === nextSelector) {
                throw xmlMinErr('qureySelectorAll', '{0}不是一个正确的选择器！', selector);
            }
            parentElements = unique(parentElements);
            if (nextSelector) {
                return selectDistributor(nextSelector, parentElements);
            }
            return parentElements;
        }
        return selectDistributor(selector, [this]);
    }
    querySelector(selector) {
        return this.querySelectorAll(selector)[0] || null;
    }
}
class ElementMethod extends Element {
    getElementsByTagName(tagName) {
        tagName = trim(tagName);
        let elements = [];
        for (let i = 0, len = this.children.length; i < len; i++) {
            if (this.children[i].tagName === tagName || tagName === '*') {
                elements.push(this.children[i]);
            }
            if (this.children[i].children) {
                this.children[i].getElementsByTagName(tagName).filter(function (item) {
                    elements.push(item);
                });
            }
        }
        return elements;
    }
    getElementsByClassName(className) {
        let elements = [];
        for (let i = 0, len = this.children.length; i < len; i++) {
            if (this.children[i].hasClass(className)) {
                elements.push(this.children[i]);
            }
            if (this.children[i].children) {
                this.children[i].getElementsByClassName(className).filter(function (item) {
                    elements.push(item);
                });
            }
        }
        return elements;
    }
    appendChild(TBDomElement) {
        if (TBDomElement.parentNode !== this) {
            TBDomElement.parentNode = this;
            this.childNodes.push(TBDomElement);
            if (TBDomElement.nodeType === NODE_TYPE_ELEMENT) {
                this.children.push(TBDomElement);
            }
        } else {
            for (let i = 0, len = this.childNodes.length; i < len; i++) {
                if (TBDomElement === this.childNodes[i]) {
                    this.childNodes.push(this.childNodes.splice(i, 1));
                    break;
                }
            }
            if (TBDomElement.nodeType === NODE_TYPE_ELEMENT) {
                for (let i = 0, len = this.children.length; i < len; i++) {
                    if (TBDomElement === this.children[i]) {
                        this.children.push(this.children.splice(i, 1));
                        break;
                    }
                }
            }
        }
        this.$refresh();
    }
    removeChild(TBDomElement) {
        for (let i = 0, len = this.childNodes.length; i < len; i++) {
            if (this.childNodes[i] === TBDomElement) {
                this.childNodes.splice(i, 1);
                break;
            }
        }
        if (TBDomElement.nodeType === NODE_TYPE_ELEMENT) {
            for (let i = 0, len = this.children.length; i < len; i++) {
                if (this.children[i] === TBDomElement) {
                    this.children.splice(i, 1);
                    break;
                }
            }
        }
        this.$refresh();
    }
    insertBefore(TBDomElement, nextElement) {
        let parentNode = TBDomElement.parentNode;
        for (let i = 0, len = parentNode.childNodes.length; i < len; i++) {
            if (parentNode.childNodes[i] === TBDomElement) {
                parentNode.childNodes.splice(i, 1);
                break;
            }
        }
        for (let i = 0, len = parentNode.children.length; i < len; i++) {
            if (parentNode.children[i] === TBDomElement) {
                parentNode.children.splice(i, 1);
                break;
            }
        }
        TBDomElement.parentNode = this;
        for (let i = 0, len = this.childNodes.length; i < len; i++) {
            if (this.childNodes[i] === nextElement) {
                this.childNodes.splice(i, 0, TBDomElement);
                break;
            }
        }
        for (let i = 0, len = this.children.length; i < len; i++) {
            if (this.children[i] === nextElement) {
                this.children.splice(i, 0, TBDomElement);
                break;
            }
        }
        this.$refresh();
    }
}
class DocumentElement extends ElementMethod {
    constructor(...args) {
        super(...args);
        this.$targetElement = null;
        this.nodeType = NODE_TYPE_DOCUMENT;
        this.parentNode = null;
        this.innerHTML = '';
        this.innerText = '';
        this.outerHTML = '';
        this.classList = [];
        this.className = '';
        this.childNodes = [];
        this.children = [];
        this.eventListener = {};
    }
    createElement(tag) {
        tag = tag.toLowerCase();
        if (ODD_TAG_LIST.indexOf(tag) === -1) {
            return new EvenElement(tag);
        }
        return new OddElement(tag);
    }
    createTextNode(text) {
        return new TextElement(text);
    }
    createComment(commentText) {
        return new CommentElement(commentText);
    }
    getElementById(id) {
        function getElementById(parent) {
            let element = null;
            let children = parent.children || [];
            for (let i = 0, len = children.length; i < len; i++) {
                if (children[i].id === id) {
                    return children[i];
                } else {
                    element = getElementById(children[i]);
                    if (element) return element;
                }
            }
            return element;
        }
        return getElementById(this);
    }
    getElementsByName(name) {
        let elements = [];
        this.getElementsByTagName('form').filter(function (item) {
            if (item.hasAttribute(name)) {
                elements.push(item);
            }
        });
        return elements;
    }
}
class OddElement extends Element {
    constructor(tagName) {
        super();
        this.$targetElement = null;
        this.tagName = this.nodeName = tagName.toUpperCase();
        this.nodeType = NODE_TYPE_ELEMENT;
        this.parentNode = null;
        this.innerHTML = '';
        this.innerText = '';
        this.id = '';
        this.outerHTML = '';
        this.classList = [];
        this.className = '';
        this.attributes = [];
        this.eventListener = {};
    }
}
class EvenElement extends ElementMethod {
    constructor(tagName) {
        super();
        this.$targetElement = null;
        this.tagName = this.nodeName = tagName.toUpperCase();
        this.nodeType = NODE_TYPE_ELEMENT;
        this.parentNode = null;
        this.innerHTML = '';
        this.innerText = '';
        this.outerHTML = '';
        this.classList = [];
        this.className = '';
        this.id = '';
        this.childNodes = [];
        this.children = [];
        this.attributes = [];
        this.eventListener = {};
    }
}
class TextElement extends ElementEvent {
    constructor(text) {
        super();
        this.$targetElement = null;
        this.parentNode = null;
        this.nodeType = NODE_TYPE_TEXT;
        this.nodeName = '#text';
        this.textContent = text.replace(/[\n\t\r\v]/g, '');
        this.eventListener = {};
    }
}
class CommentElement extends RootElement {
    constructor(commentText) {
        super();
        this.$targetElement = null;
        this.parentNode = null;
        this.nodeType = NODE_TYPE_COMMENT;
        this.nodeName = '#comment';
        this.textContent = commentText;
    }
}
export default DocumentElement;
