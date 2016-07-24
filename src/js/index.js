import HtmlParser from './modules/htmlParser';

window.onload = function() {
    let text = document.querySelector('html').outerHTML;
    let htmlParser = new HtmlParser();
    let i = 0;
    let time = Date.now();
    let a;
    while (i < 1000) {
        a = htmlParser.parse(text);
        i++;
    }
    console.log(Date.now() - time);
    console.log(a.getOuterHtml());
    console.log(a);
};
