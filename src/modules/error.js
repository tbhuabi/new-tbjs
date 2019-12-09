export default function minErr(module) {
    return function (code, template, ...info) {
        let msg = '[' + (module ? module + ':' : '') + code + ']  ';

        msg += template.replace(/\{(\d+)\}/g, (str, $1) => {
            return info[+$1] ? info[+$1] : str;
        });

        msg += '\nhttp://www.TBjs.org?module=' + module + '&type=' + code;
        return new Error(msg);
    }
}
