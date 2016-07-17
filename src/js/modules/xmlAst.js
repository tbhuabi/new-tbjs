import minErr from './error';

const xmlParseMinErr = minErr('XmlAst');

const NODE_TYPE_ELEMENT = 1;
const NODE_TYPE_TEXT = 3;
const NODE_TYPE_COMMENT = 8;
const NODE_TYPE_DOCUMENT = 9;
const NODE_TYPE_DOCUMENTFRAGMENT = 11;

let ODD_TAG_LIST = ['img', 'input', 'br', 'hr', 'param', 'meta', 'link'];

export default class XmlAst {
  ast(text) {
    this.text = text;
    this.length = text.length;
    this.index = 0;
    this.rowIndex = 0;
    this.rowCharIndex = 0;
    this.nodeTree = [];
    return this.fragment();
  }
  fragment() {
    const EMPTY_REG_STRING = '[\\n\\t\\r\\v\\s]';
    const ALL_RGE_STRING = '.|' + EMPTY_REG_STRING;
    const TAG_OR_PROPERTY_REG_STRING = '[^\\\\/<>\\n\\t\\r\\v\\s]+';
    const TAG_ATTRIBUTE_VALUE_REG_STRING = '="[^"]*"|=\'[^\']*\'|=[^\\s><]+';
    const TAG_ATTRIBUTE_REG_STRING = EMPTY_REG_STRING + '+' + TAG_OR_PROPERTY_REG_STRING + '(?:' + TAG_ATTRIBUTE_VALUE_REG_STRING + ')?';
    const TAG_CLOSE_REG_STRING = '</' + TAG_OR_PROPERTY_REG_STRING + EMPTY_REG_STRING + '*>';



    const TEST_TAG_REG = new RegExp('^<' + TAG_OR_PROPERTY_REG_STRING + EMPTY_REG_STRING + '*/?>|^<' + TAG_OR_PROPERTY_REG_STRING + '(?:' + TAG_ATTRIBUTE_REG_STRING + ')+' + EMPTY_REG_STRING + '*/?>|^</' + TAG_OR_PROPERTY_REG_STRING + EMPTY_REG_STRING + '*>');



    const fragment = {
      nodeType: NODE_TYPE_DOCUMENTFRAGMENT,
      childNodes: []
    };
    this.ignoreEmpty();

    let parent = fragment;
    while (this.index < this.length) {
      let ch = this.text.charAt(this.index);
      if (ch == '<') {
        if (this.expect('<!--')) {
          let comment = this.readComment();
          comment.parentNode = parent;
          parent.childNodes.push(comment);
        } else if (TEST_TAG_REG.test(this.later())) {
          let tag = this.readTag();

          if (tag.closeTag && !tag.beginTag) {
            let beginTag = this.nodeTree.pop();
            if (!beginTag) {
              throw xmlParseMinErr('lexer', '文档第{0}行第{1}位`<{2}>`标签错误，未开始的标签不闭合！', this.rowIndex, tag.startIndex - this.rowCharIndex, tag.tagName);
            }
            if (beginTag != tag.tagName) {
              throw xmlParseMinErr('lexer', '文档第{0}行第{1}位标签`<{2}>`未匹配正确的开始标签！', this.rowIndex, tag.startIndex - this.rowCharIndex, tag.tagName);
            } else {
              parent = parent.parentNode;
            }
          } else {

            if (tag.beginTag && tag.closeTag) {
              tag.parentNode = parent;
              parent.childNodes.push(tag);
            } else {
              this.nodeTree.push(tag.tagName);
              tag.parentNode = parent;
              parent.childNodes.push(tag);
              if (tag.beginTag) {
                tag.childNodes = [];
                parent = tag;
                if (/^(script|style)$/i.test(tag.tagName)) {
                  let ele = this.readScriptOrStyle(tag.tagName);
                  if (ele) {
                    tag.childNodes.push(ele);
                  }
                }
              }
            }
          }
        } else {
          parent.childNodes.push(this.readText());
        }
      } else {
        parent.childNodes.push(this.readText());
      }
    }
    if (this.nodeTree.length) {
      throw xmlParseMinErr('fragment', '文档结尾`<{0}>`标签未闭合！', this.nodeTree.join('`>,<`'));
    }
    return fragment;
  }
  readScriptOrStyle(tagName) {
    const startIndex = this.index;
    const startRowIndex = this.rowIndex;
    const later = this.later();
    const endIndex = later.search(new RegExp('</' + tagName + '(.|[\\n\\t\\r\\v\\s])*>'));
    if (endIndex == -1) {
      throw xmlParseMinErr('readScriptOrStyle', '第{0}行第{1}位的{2}标签未关闭！', this.rowIndex, this.index - this.rowCharIndex, tagName.toLowerCase());
    }
    const text = later.substring(0, endIndex);
    const rowSize = text.match(/\r\n|\r|\n/g);
    if (rowSize) {
      this.rowIndex += rowSize.length;
    }
    this.index += endIndex;
    return {
      startIndex: startIndex,
      endIndex: this.index,
      startRowIndex: startRowIndex,
      endRowIndex: this.rowIndex,
      nodeType: NODE_TYPE_TEXT,
      text: text
    };
  }
  readComment() {
    const startIndex = this.index;
    const startRowIndex = this.rowIndex;
    this.index += 4;
    const later = this.later();
    let endIndex = later.indexOf('-->');
    if (endIndex == -1) {
      endIndex = later.length;
    }
    const text = later.substring(0, endIndex);
    const rowSize = text.match(/\r\n|\r|\n/g);
    if (rowSize) {
      this.rowIndex += rowSize.length;
    }
    this.index = this.index + endIndex;
    if (this.peek()) {
      this.index += 3;
    }
    return {
      startIndex: startIndex,
      endIndex: this.index,
      startRowIndex: startRowIndex,
      endRowIndex: this.rowIndex,
      nodeType: NODE_TYPE_COMMENT,
      text: text
    }
  }
  readText() {
    const startRowIndex = this.rowIndex;
    const startIndex = this.index;
    let text = '';
    while (this.index < this.length) {
      let ch = this.text.charAt(this.index);
      if (this.isEmpty(ch)) {
        text += this.ignoreEmpty();
      } else if (ch != '<') {
        text += ch;
        this.index++;
      } else {
        break;
      }
    }
    return {
      startRowIndex: startRowIndex,
      endRowIndex: this.rowIndex,
      startIndex: startIndex,
      endIndex: this.index,
      nodeType: NODE_TYPE_TEXT,
      text: text
    }
  }
  readTag() {
    const startRowIndex = this.rowIndex;
    const startIndex = this.index;
    const TEST_ODD_TAG_REG = new RegExp('^' + ODD_TAG_LIST.join('|') + '$');

    let tagName = '';
    let propertis;
    let ch;
    this.index++;
    while (this.index < this.length) {
      ch = this.text.charAt(this.index);

      if (!this.isEmpty(ch)) {
        if (ch == '>' || ch == '/' && this.peek() == '>') {
          break;
        }
        tagName += ch;
        this.index++;
      } else {
        propertis = this.readProperty();
      }
    }
    let tag = {
      startRowIndex: startRowIndex,
      endRowIndex: this.rowIndex,
      startIndex: startIndex,
      endIndex: this.index,
      nodeType: NODE_TYPE_ELEMENT,
      tagName: tagName,
      propertis: propertis || []
    }
    if (ch == '/') {
      this.index += 2;
      tag.endIndex += 2;
      tag.beginTag = true;
      tag.closeTag = true;

    } else if (ch == '>') {
      if (TEST_ODD_TAG_REG.test(tag.tagName)) {
        tag.closeTag = true;
        tag.beginTag = true;
      } else if (tagName.charAt(0) == '/') {
        tag.closeTag = true;
        tag.tagName = tagName.substring(1, tagName.length);
      } else {
        tag.beginTag = true;
      }
      this.index++;
      tag.endIndex++;
    } else {
      throw xmlParseMinErr('regTag', '文档第{0}行第{1}位标签未正确关闭！', this.rowIndex, this.index - this.rowCharIndex);
    }
    return tag;
  }
  readProperty() {
    let propertis = [];
    while (this.index < this.length) {
      this.ignoreEmpty();
      const startRowIndex = this.rowIndex;
      const startIndex = this.index;
      let ch = this.text.charAt(this.index);
      if (ch == '>' || ch == '/' && this.peek() == '>') {
        break;
      }
      let property = {
        name: this.readPropertyKey()
      };
      ch = this.text.charAt(this.index);
      if (ch == '=') {
        if (!this.isEmpty(this.peek())) {
          property.value = this.readPropertyValue()
        }
      }
      property.startRowIndex = startRowIndex;
      property.endRowIndex = this.rowIndex;
      property.startIndex = startIndex;
      property.endIndex = this.index;
      propertis.push(property);
    }
    return propertis;
  }
  readPropertyKey() {
    let key = '';
    while (this.index < this.length) {
      let ch = this.text.charAt(this.index);
      if (!this.isEmpty(ch) && ch != '=' && ch != '>') {
        if (ch == '/' && this.peek() == '>') {
          break;
        }
        key += ch;
        this.index++;
      } else {
        break;
      }
    }
    return key;
  }
  readPropertyValue() {
    let value = '';
    let escape = false;
    let quote = this.peek();
    if (quote == '"' || quote == "'") {
      this.index++;
    }
    this.index++;
    while (this.index < this.length) {
      let ch = this.text.charAt(this.index);
      if (quote != '"' && quote != "'" && this.isEmpty(ch)) {
        return value;
      }
      if (escape) {
        if (ch === 'u') {
          let hexCode = this.text.substring(this.index + 1, this.index + 5);
          if (/[\da-f]{4}/i.test(hexCode)) {
            value += String.fromCharCode(parseInt(hexCode, 16));
            this.index += 4;
          } else {
            throw xmlParseMinErr('readPropertyValue', '转义\\{0}失败，或者\\{0}不是一个合法的nuicode字符', hexCode);
          }
        } else {
          this.index--;
          value += this.ignoreEmpty();
        }
        escape = false;
      } else if (ch == '\\') {
        escape = true;
      } else if (ch == quote && ch == '"' || ch == "'") {
        this.index++;
        return value;
      } else {
        value += ch;
      }
      this.index++;
    }
  }
  later() {
    return this.text.slice(this.index, this.length);
  }
  expect(text) {
    const entIndex = this.index + text.length;
    return entIndex <= this.length ? text === this.text.slice(this.index, entIndex) : false;
  }
  isEmpty(text) {
    return typeof text !== 'string' || text === ' ' || text === '\n' || text === '\r' || text === '\t' || text === '\v' || text === '\u00a0';
  }
  ignoreEmpty() {
    let empty = '';
    while (this.index < this.length) {
      let ch = this.text.charAt(this.index);

      if (!this.isEmpty(ch)) {
        break;
      }
      empty += ch;
      this.index++;

      if (ch == '\r') { // Mac OS
        if (this.peek() == '\n') { // linux,unix
          this.index++;
        }
        this.rowIndex++;
        this.rowCharIndex = this.index;
      } else if (ch == '\n') { // windows
        this.rowIndex++;
        this.rowCharIndex = this.index;
      }
    }
    return empty;
  }
  peek() {
    const index = this.index + 1;
    return index < this.length ? this.text.charAt(index) : false;
  }
}
