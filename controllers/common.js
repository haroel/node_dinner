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
    this.body = viewtemplate("about.html");
};

handlers["GET /"] = handlers["GET /about.html"];

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