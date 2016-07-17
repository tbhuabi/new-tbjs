import HtmlParser from './modules/htmlParser';

window.onload = function () {
    let htmlParser = new HtmlParser();
    let a = htmlParser.parse(document.querySelector('html').outerHTML);
    console.log(a)
};
