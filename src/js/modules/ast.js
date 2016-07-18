import Lexer from './lexer';

export default class Ast {
    constructor() {
        this.lexer = new Lexer();
        this.constants = {
            'true': {
                type: AST.Literal,
                value: true
            },
            'false': {
                type: AST.Literal,
                value: false
            },
            'null': {
                type: AST.Literal,
                value: null
            },
            'undefined': {
                type: AST.Literal,
                value: undefined
            },
            'this': {
                type: AST.ThisExpression
            }
        }
    }
    ast(text) {
        this.text = text;
        this.tokens = this.lexer.lex(text);
        let value = this.program();

        if (this.tokens.length !== 0) {
            throw astMinErr('ast', '表达式：`{0}`中，`{1}`没用使用！', text, this.tokens[0]);
        }
        return value;
    }
    program() {
        let body = [];
        while (true) {
            if (this.tokens.length > 0 && !this.peek('}', ')', ';', ']')) {
                body.push(this.expressionStatement());
            }
            if (!this.expect(';')) {
                return {
                    type: AST.Program,
                    body: body
                };
            }
        }
    }
    expressionStatement() {
        return {
            type: AST.ExpressionStatement,
            expression: this.filterChain()
        }
    }
    filterChain() {
        let left = this.expression();
        let token;
        while (token = this.expect('|')) {
            left = this.filter(left);
        }
        return left;
    }
    expression() {
        return this.assignment();
    }
    assignment() {
        let result = this.ternary();
        if (this.expect('=')) {
            result = {
                type: AST.AssignmentExpression,
                left: result,
                operator: '=',
                right: this.assignment()
            }
        }
        return result;
    }
    ternary() {
        let test = this.logicalOR();
        let alternate;
        let consequent;
        if (this.expect('?')) {
            alternate = this.expression();
            if (this.expect(':')) {
                consequent = this.expression();
                return {
                    type: AST.ConditionalExpression,
                    test: test,
                    alternate: alternate,
                    consequent: consequent
                }
            }
        }
        return test;
    }
    logicalOR() {
        let left = this.logicalAND();
        while (this.expect('||')) {
            left = {
                type: AST.LogicalExpression,
                left: left,
                operator: '||',
                right: this.logicalAND()
            };
        }
        return left;
    }
    logicalAND() {
        let left = this.equality();

        while (this.expect('&&')) {
            left = {
                type: AST.LogicalExpression,
                left: left,
                operator: '&&',
                right: this.equality()
            }
        }
        return left;
    }
    equality() {
        let left = this.relational();
        let token;
        while (token = this.expect('==', '!=', '!==', '===')) {
            left = {
                type: AST.BinaryExpression,
                left: left,
                operator: token.text,
                right: this.relational()
            }
        }
        return left;
    }
    relational() {
        let left = this.additive();
        let token;
        while (token = this.expect('<', '>', '<=', '>=')) {
            left = {
                type: AST.BinaryExpression,
                left: left,
                operator: token.text,
                right: this.additive()
            }
        }
        return left;
    }
    additive() {
        let left = this.multiplicative();
        let token;
        while (token = this.expect('+', '-')) {
            left = {
                type: AST.BinaryExpression,
                left: left,
                operator: token.text,
                right: this.multiplicative()
            }
        }
        return left;
    }
    multiplicative() {
        let left = this.unary();
        let token;
        while (token = this.expect('*', '/', '%')) {
            left = {
                type: AST.BinaryExpression,
                left: left,
                operator: token.text,
                right: this.unary()
            }
        }
        return left;
    }
    unary() {
        let token = this.expect('+', '-', '!');
        if (token) {
            return {
                type: AST.UnaryExpression,
                operator: token.text,
                argument: this.unary()
            }
        } else {
            return this.primary();
        }
    }
    primary() {
        let primary;
        if (this.expect('(')) {
            primary = this.filterChain();
            this.consume(')');
        } else if (this.expect('[')) {
            primary = this.arrayDeclaration();
        } else if (this.expect('{')) {
            primary = this.object();
        } else if (this.constants.hasOwnProperty(this.peek().text)) {
            primary = this.constants[this.consume().text];
        } else if (this.peek().identifier) {
            primary = this.identifier();
        } else if (this.peek().constant) {
            primary = this.constant();
        } else {
            throw astMinErr('primary', '`{0}`不是一个正确的表达式！', this.peek().text);
        }
        let next;
        while (next = this.expect('[', '(', '.')) {
            if (next.text === '[') {
                primary = {
                    type: AST.MemberExpression,
                    object: primary,
                    property: this.expression()
                }
                this.consume(']');
            } else if (next.text === '(') {
                primary = {
                    type: AST.CallExpression,
                    callee: primary,
                    arguments: this.parseArguments()
                }
                this.consume(')');
            } else if (next.text === '.') {
                primary = {
                    type: AST.MemberExpression,
                    object: primary,
                    property: this.expression()
                }
            } else {
                throw astMinErr('primary', '`{0}`不是一个正确的表达式！', next.text);
            }
        }
        return primary;
    }
    parseArguments() {
        let args = [];
        if (this.peek().text !== ')') {
            do {
                args.push(this.expression());
            } while (this.expect(','));
        }
        return args;
    }
    filter(baseExpression) {
        let args = [baseExpression];
        let result = {
            type: AST.CallExpression,
            callee: this.identifier(),
            arguments: args,
            filter: true
        };
        while (this.expect(':')) {
            args.push(this.expression());
        }
        return result;
    }
    object() {
        let properties = [];
        let property;
        if (!this.peek('}')) {
            do {
                if (this.peek('}')) {
                    break;
                }
                property = {
                    type: AST.Property
                };
                if (this.peek().constant) {
                    property.key = this.constant();
                } else if (this.peek().identifier) {
                    property.key = this.identifier();
                } else {
                    throw astMinErr('object', '`{0}`不能作为一个标识符或属性名！', this.peek().text);
                }
                this.consume(':');
                property.value = this.expression();
                properties.push(property);
            } while (this.expect(','));
        }
        this.consume('}');
        return {
            type: AST.ObjectExpression,
            properties: properties
        }
    }
    identifier() {
        let token = this.consume();
        if (token.identifier) {
            return {
                type: AST.Identifier,
                value: token.text
            }
        }
        throw astMinErr('identifier', '`{0}`不能作为一个标识符或属性名！', token.text);
    }
    constant() {
        return {
            type: AST.Literal,
            value: this.consume().value
        }
    }
    arrayDeclaration() {
        let elements = [];
        if (!this.peek(']')) {
            do {
                if (this.peek(']')) {
                    break;
                }
                elements.push(this.expression());
            } while (this.expect(','));
        }
        this.consume(']');
        return {
            type: AST.ArrayExpression,
            elements: elements
        }
    }
    expect(e1, e2, e3, e4) {
        let token = this.peek(e1, e2, e3, e4);
        if (token) {
            this.tokens.shift();
            return token;
        }
        return false;
    }
    peek(e1, e2, e3, e4) {
        if (this.tokens.length) {
            let token = this.tokens[0];
            let text = token.text;
            if (text === e1 || text === e2 || text === e3 || text === e4 || !e1 && !e2 && !e3 && !e4) {
                return token
            }
        }
        return false;
    }
    consume(e1) {
        if (this.tokens.length) {
            let token = this.expect(e1);
            if (token) return token;
        }
        throw astMinErr('comsume', '解析表达式出错，`{0}`中缺少`{1}`！', this.text, e1);
    }
}

AST.Program = 'Program';
AST.ExpressionStatement = 'ExpressionStatement';
AST.AssignmentExpression = 'AssignmentExpression';
AST.ConditionalExpression = 'ConditionalExpression';
AST.LogicalExpression = 'LogicalExpression';
AST.BinaryExpression = 'BinaryExpression';
AST.UnaryExpression = 'UnaryExpression';
AST.CallExpression = 'CallExpression';
AST.MemberExpression = 'MemberExpression';
AST.Identifier = 'Identifier';
AST.Literal = 'Literal';
AST.ArrayExpression = 'ArrayExpression';
AST.Property = 'Property';
AST.ObjectExpression = 'ObjectExpression';
AST.ThisExpression = 'ThisExpression';
