/**
 * Created by howe on 2016/11/26.
 */
const path = require("path");
const koa = require("koa");
const Router = require('koa-router');

const config = require('./__config.js');
var controller = require("./controller.js");


var staticFiles = require("./util/static_files.js");

let app = koa();
let router = new Router();

app.use( function *(next) {
    var start = new Date().getTime(),
        execTime;
    yield next;
    execTime = new Date().getTime() - start;
    this.response.set('X-Response-Time', `${execTime}ms`);
    console.log(`Process ${this.request.method} ${this.request.ip}  ${this.request.url} 处理时间${execTime}ms...`);
    yield controller.endHandler(this);
});

app.use( staticFiles( '/static/', path.join( __dirname,"views","static") ) );

controller.initControllers(router);

app.use(router.routes());


let server = app.listen(config.SERVER_PORT,config.SERVER_IP,  function (error)
{
    if (error)
    {
        console.log(error);
        return;
    }
    var host = server.address().address;
    var port = server.address().port;
    console.log("The server is Started！ ",server.address());
});