import minErr from './error';

let OPERATORS = {};
'+ - * / % === !== == != < > <= >= && || ! = |'.split(' ').forEach(operator => {
    OPERATORS[operator] = true;
});

const ESCAPE = {
    "n": "\n",
    "f": "\f",
    "r": "\r",
    "t": "\t",
    "v": "\v",
    "'": "'",
    '"': '"'
};
const lexerMinErr = minErr('Lexer');

export default class Lexer {
    lex(text) {
        this.index = 0;
        this.tokens = [];
        this.text = text;
        while (this.index < this.text.length) {
            let ch = this.text.charAt(this.index);

            if (ch === '"' || ch === "'") {
                this.readString(ch);
            } else if (this.isNumber(ch) || ch === '.' && this.isNumber(this.peek())) {
                this.readNumber();
            } else if (this.isIdent(ch)) {
                this.readIdent();
            } else if ('(){}[].,;:?'.indexOf(ch) !== -1) {
                this.tokens.push({
                    text: ch,
                });
                this.index++;
            } else if (ch === ' ' || ch === '\r' || ch === '\t' ||
                ch === '\n' || ch === '\v' || ch === '\u00A0') {
                this.index++;
            } else {
                let t1 = ch + this.peek();
                let t2 = t1 + this.peek(2);

                let option1 = OPERATORS[ch];
                let option2 = OPERATORS[t1];
                let option3 = OPERATORS[t2];

                if (option1 || option2 || option3) {
                    let token = option3 ? t2 : (option2 ? t1 : ch);
                    this.tokens.push({
                        text: token,
                        operator: true
                    });
                    this.index += token.length;
                } else {
                    throw lexerMinErr('lexer', '`{0}`不是一个合法的表达式！', this.text);
                }
            }
        }
        return this.tokens;
    }
    isIdent(text) {
        return text >= 'a' && text <= 'z' || text >= 'A' && text <= 'Z' || text === '$' || text === '_';
    }
    readIdent() {
        let start = this.index;
        while (this.index < this.text.length) {
            let ch = this.text.charAt(this.index);
            if (!(this.isIdent(ch) || this.isNumber(ch))) {
                break;
            }
            this.index++;
        }
        this.tokens.push({
            text: this.text.slice(start, this.index),
            identifier: true
        });
    }
    readNumber() {
        let value = '';
        let appearedDot = false;
        while (this.index < this.text.length) {
            let ch = this.text.charAt(this.index).toLowerCase();
            if (ch === '.') {
                if (!this.isNumber(this.peek())) {
                    throw lexerMinErr('readNumber', '解析数字`{0}`出错，.后面不能为`{1}`！', value, this.peek());
                }
                if (appearedDot) {
                    throw lexerMinErr('readNumber', '解析数字`{0}`' + value + '出错，后面不能为`.`！', value);
                }
                value += ch;
                appearedDot = true;
            } else if (this.isNumber(ch)) {
                value += ch;
            } else {
                let nextText = this.peek();
                if (ch === 'e' && this.isExpOperator(nextText)) {
                    value += ch;
                } else if (this.isExpOperator(ch) && nextText && this.isNumber(nextText) && value.charAt(value.length - 1) === 'e') {
                    value += ch;
                } else if (this.isExpOperator(ch) && (!nextText || !this.isNumber(nextText)) && value.charAt(value.length - 1) === 'e') {
                    throw lexerMinErr('readNumber', '{0}{1}不是一个正确的数字！', value, ch);
                } else {
                    break;
                }
            }
            this.index++;
        }
        this.tokens.push({
            text: value,
            value: Number(value),
            constant: true
        })
    }
    isExpOperator(text) {
        return text === '+' || text === '-' || this.isNumber(text);
    }
    isNumber(ch) {
        return typeof ch === 'string' && ch >= '0' && ch <= '9';
    }
    peek(index) {
        let i = index || 1;
        return this.index + i < this.text.length ? this.text.charAt(this.index + i) : false;
    }
    readString(quote) {
        let value = '';
        let escape = false;
        this.index++;
        while (this.index < this.text.length) {
            let ch = this.text.charAt(this.index);
            if (escape) {
                if (ch === 'u') {
                    let hexCode = this.text.substring(this.index + 1, this.index + 5);
                    if (/[\da-f]{4}/i.test(hexCode)) {
                        value += String.fromCharCode(parseInt(hexCode, 16));
                        this.index += 4;
                    } else {
                        throw lexerMinErr('readString', '转义`\\{0}`失败，或者`\\{0}`不是一个合法的nuicode字符！', hexCode);
                    }
                } else {
                    value += ESCAPE[ch] || ch;
                }
                escape = false;
            } else if (ch === '\\') {
                escape = true;
            } else if (ch === quote) {
                this.index++;
                this.tokens.push({
                    text: quote + value + quote,
                    constant: true,
                    value: value
                });
                return;
            } else {
                value += ch;
            }
            this.index++;
        }
    }
}
