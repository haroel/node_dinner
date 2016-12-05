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
handlers["GET /"] = handlers["GET /about.html"]
module.exports = handlers;