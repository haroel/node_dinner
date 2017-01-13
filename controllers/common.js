/**
 * Created by howe on 2016/12/5.
 */
const path = require("path");

var model = require("../db/Model.js");
var fsPromise = require("../util/fsPromise.js");
var viewtemplate =require("../viewtemplate.js");

let handlers = {};

handlers["GET /about.html"] = function *(next)
{
    let req = this.request;
    let ip = require("../__config.js").SERVER_IP;
    if (ip === "192.168.90.57")
    {
        this.body = viewtemplate("about1.html");
    }else
    {
        this.body = viewtemplate("about.html");
    }
};

handlers["GET /"] = handlers["GET /about.html"];

// 网页标题icon
handlers["GET /favicon.ico"] = function*(next)
{
    this.redirect("/static/favicon.ico");
};
// 处理404错误
handlers["404"] = function *( url )
{
    if (url.indexOf(".") >= 0)
    {
        console.log("404错误 ",url);
        return viewtemplate("404.html");
    }
    return "404";
};

module.exports = handlers;