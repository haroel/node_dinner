/**
 * Created by howe on 2016/12/5.
 */
const path = require("path");

var model = require("../db/Model.js");
var fsPromise = require("../util/fsPromise.js");
var viewtemplate =require("../viewtemplate.js");
var findError = require("../util/findErrorLine.js");
const ErrorCode = require("../db/ErrorCode.js");


let getNowFormatDate = function () {
    let date = new Date();
    let seperator1 = "-";
    let seperator2 = ":";
    let month = date.getMonth() + 1;
    let strDate = date.getDate();
    if (month >= 1 && month <= 9) {
        month = "0" + month;
    }
    if (strDate >= 0 && strDate <= 9) {
        strDate = "0" + strDate;
    }
    let currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate
        + " " + date.getHours() + seperator2 + date.getMinutes()
        + seperator2 + date.getSeconds();
    return currentdate;
}

let handlers = {};

handlers["GET /lua-errorlog.html"] = function *(next)
{
    this.body = viewtemplate("lua-errorlog.html");
};

handlers["GET /lua/getLog"] = function *(next)
{
    let req = this.request;
    let version = req.query["version"];
    if (!version)
    {
        console.log("<<<< result 访问错误");
        this.status = 400;
        return;
    }

    let errorlog = new Buffer(req.query["errorlog"], 'base64').toString();
    let reg = /\'(\S+)\'\?*\:(\d+)/gm;
    console.log("\n >>> client Ip %s version %s Time: %s",req.ip,version , getNowFormatDate());

    let params = [];

    let execRets = reg.exec(errorlog);
    while(execRets)
    {
        params.push({func:execRets[1],num:execRets[2]});
        execRets = reg.exec(errorlog);
    }
    console.log("参数",params);
    // Promise + generator ES6写法
    try
    {
        let t1 = Date.now();
        let result = yield findError.search2(version, params);
        console.log("查询时间",Date.now()-t1);
        console.log("<<<< result ",result.length);
        this.body = result;

    }catch(error)
    {
        this.body = error;
    }
};

handlers["GET /lua/getVersionList"] = function *(next)
{
    let req = this.request;

    console.log("client Ip %s",req.ip);
    let list = findError.getVersionList();
    this.body = JSON.stringify(list);
};

handlers["GET /lua/errorlog"] = handlers["GET /lua-errorlog.html"];
handlers["GET /lua-errorlog"] = handlers["GET /lua-errorlog.html"];

handlers["GET /:tag/lua/getVersionList"] = handlers["GET /lua/getVersionList"];
handlers["GET /:tag/lua/getLog"] = handlers["GET /lua/getLog"];

module.exports = handlers;