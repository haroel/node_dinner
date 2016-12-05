/**
 * Created by howe on 2016/11/26.
 */
const PRE_FIX = "/dinner";
const path = require("path");
const fs = require("fs");

let viewtemplate =require("./viewtemplate.js");

const controllerJsPath = path.join(__dirname, "controllers" );

let addMapping = function (router, mapping)
{
    for (let url in mapping) {
        if (url.startsWith('GET ')) {
            let path = url.substring(4);
            router.get(path, mapping[url]);
            console.log(`register URL mapping: GET ${path}`);
        } else if (url.startsWith('POST ')) {
            let path = url.substring(5);
            router.post(path, mapping[url]);
            console.log(`register URL mapping: POST ${path}`);
        } else {
            console.log(`invalid URL: ${url}`);
        }
    }
};

module.exports.initControllers = function (router)
{
// 先导入fs模块，然后用readdirSync列出文件
// 这里可以用sync是因为启动时只运行一次，不存在性能问题:
    let files = fs.readdirSync( controllerJsPath );

// 过滤出.js文件:
    let js_files = files.filter((f)=>{
        return f.endsWith('.js');
    });

// 处理每个js文件:
    for (let f of js_files) {
        console.log(`process controller: ${f}...`);
        // 导入js文件:
        let mapping = require( path.join(controllerJsPath,f) );
        addMapping(router,mapping);
    }
};