/**
 * Created by howe on 2016/11/26.
 */
const koa = require("koa");
const Router = require('koa-router');

const config = require('./__config.js');
var handler = require("./handler.js");

let app = koa();
let router = new Router({
    prefix: '/dinner'
});

handler(router,app);
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