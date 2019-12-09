import Vue from 'vue'
import VueRouter from 'vue-router'

import App from './views/app.vue'
import './components'
import 'normalize.css'
import './assets/less/index.less'
import routes from './routes'

import Ast from './modules/ast';
import Lexer from './modules/lexer';
import HTMLParser from './modules/htmlParser';

let ast = new Ast();

let b = new HTMLParser().parse('<p>1111 <span>2222</span>a</p> <!-- test  -->');
let a = new Lexer().lex('{a: 333, aa: "3333", b: 444, c: {cc: 111}}');

console.log(a);

let result = ast.ast('1+ fun_add( 123)+fun_add(fun(45))');
// console.log(result);

Vue.use(VueRouter);

let router = new VueRouter({
  mode: 'history',
  routes: [{
    path: '/',
    redirect: '/home',
    component: App,
    children: routes
  }]
})

new Vue({
  router
}).$mount('#app')
