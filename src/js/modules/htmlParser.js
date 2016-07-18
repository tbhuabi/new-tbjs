import minErr from './error';
import XmlAst from './xmlAst';
import DocumentElement from './virtualDom';
import {
    NODE_TYPE_ELEMENT,
    NODE_TYPE_TEXT,
    NODE_TYPE_COMMENT,
    NODE_TYPE_DOCUMENT,
    NODE_TYPE_DOCUMENTFRAGMENT,
}
from './variables';
const htmlParseMinErr = minErr('htmlParser');
export default class HtmlParser {
    parse(text) {
        this.text = text;
        this.ast = XmlAst;
        this.fragment = new XmlAst().ast(text);
        this.virtualDom = new DocumentElement();
        return this.compile(this.virtualDom, this.fragment.childNodes);
    }
    compile(parentNode, elements) {
        elements.forEach(item => {
            let node;
            switch (item.nodeType) {
                case NODE_TYPE_ELEMENT:
                    node = this.virtualDom.createElement(item);
                    if (item.childNodes) {
                        this.compile(node, item.childNodes);
                    }
                    break;
                case NODE_TYPE_TEXT:
                    node = this.virtualDom.createTextNode(item);
                    break;
                case NODE_TYPE_COMMENT:
                    node = this.virtualDom.createComment(item);
                    break;
                default:
                    throw htmlParseMinErr('compile', '编译虚拟DOM出错，当前节点类型为`{0}`！', item.nodeType);
            }
            parentNode.appendChild(node);
            if (item.propertis) {
                item.propertis.forEach(attr => {
                    node.setAttribute(attr.key, attr.value);
                })
            }
        })
        return this.virtualDom;
    }
}
