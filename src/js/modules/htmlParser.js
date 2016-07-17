import XmlAst from './xmlAst';
import DocumentElement from './virtualDom';

export default class HtmlParser {
    parse(text) {
        this.text = text;
        this.ast = XmlAst;
        this.fragment = new XmlAst().ast(text);
        this.virtualDom = new DocumentElement();
        return this.compile();
    }
    compile() {
        debugger;
        console.log('aaa')
    }
}
