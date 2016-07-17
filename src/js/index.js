import HtmlParser from './modules/htmlParser';

window.onload = function () {
    let htmlParser = new HtmlParser();
    debugger;
    let a = htmlParser.parse('<aa/><img>');
    console.log(a)
};
