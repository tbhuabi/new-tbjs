import XmlAst from './modules/xmlAst';

window.onload = function () {
  let ast = new XmlAst();
  let a = ast.ast('<aa/><img>');
  console.log(a)
};
