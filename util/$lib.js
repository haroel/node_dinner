/**
 * Created by howe on 2016/11/16.
 */
const path = require("path");
const https = require('https');
const cheerio = require("cheerio");
//const request = require("request");
//const phantom = require('phantom');
//const superagent = require("superagent");

const child_process = require('child_process');
const spawn = child_process.spawn;
const exec = child_process.exec;

let trace = console.log;

let getWebPageContent = function (_url) {

    let handler = function(resolve,reject)
    {
        let html = "";
        let req = https.get(_url, function(res){
            res.setEncoding('utf8');
            res.on('data', function(chunk){
                html += chunk;
            });
            res.on('error', function(err){
                trace("error",err);
                reject(err);
            });
            res.on('end', function(err){
                resolve(html);
            });
        });
    };
    return new Promise(handler);
};

let getHtml = function (url) {
    return new Promise(
        (resolve,reject)=>
        {
            let isSuccess = true;
            let htmlData = "";
            let params = [
                path.join(__dirname,"bin","phantomjs_get.js"),
                url
            ];
            let free = spawn( path.join(__dirname,"bin",'phantomjs'), params);
            // 捕获标准输出并将其打印到控制台
            free.stdout.on('data', function (data) {
                htmlData += "" + data;
            });
            // 捕获标准错误输出并将其打印到控制台
            free.stderr.on('data', function (data) {
                trace('standard error output:\n' + data);
                isSuccess = false;
            });
            // 注册子进程关闭事件
            free.on('exit', function (code, signal)
            {
                trace('child process eixt ,exit:' + code);
                if (!isSuccess || htmlData.length < 1)
                {
                    reject( "phandomjs error"+url );
                }else
                {
                    resolve( htmlData );
                }
            });
        }
    )
};


let getEleList = function * (_url)
{
    let result = {
        title:"",
        list:null,
        link:_url
    };
    let html = yield getHtml(_url);
    console.log("url",_url);
    let $ = cheerio.load(html);
    try
    {
        let title = $(".shopguide").find(".shopguide-info-wrapper").find("h1");
        result.title = title.text();
        console.log("page title",result.title);

    }catch(e)
    {
        return Promise.reject(e);
    }
    try
    {
        let menuList = $(".shopmain").find(".shopmenu-main");
        menuList = menuList.find(".shopmenu-food");
        console.log("menu dom",menuList.length);
        let arr = [];
        let _set = new Set();
        menuList.each(function(id,element)
        {
            let _id = $(element).attr("id");
            if (_set.has(_id))
            {return;}
            _set.add(_id);
            let obj = {};
            obj.id = _id;
            obj.img = "http:"+$(element).find("img").attr("ng-src");
            obj.name = $(element).find(".col-2 h3").text();
            obj.price = $(element).find(".col-3").html().replace(/[^\d]+/,"");
            arr.push(obj);
        });
        result.list = arr;
        console.log("菜单总长度",arr.length);
    }catch(e)
    {
        return Promise.reject(e);
    }
    return result;
};

module.exports.getHtml = getHtml;

module.exports.getEleList = getEleList;
module.exports.getWebPageContent = getWebPageContent;