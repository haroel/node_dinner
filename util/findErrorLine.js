'use strict';
var trace = console.log;

var fs = require("fs");
var os = require("os");
var path = require("path");

let main_dir_path = "F:\\RSLG_branche/";
let _os = os.type();
if (_os === "Darwin")
{
    main_dir_path = "/Users/howe/Documents/RSLG/branches/";
}

const ignoreFileFormat = [".svn",".DS_Store",".git"];       // 忽略文件格式

function isIgnore(files)
{
    for (let f of ignoreFileFormat)
    {
        if (files.indexOf(f) >= 0)
        {
            return true;
        }
    }
    return false;
}

function loopDir( dir_path, path_arr )
{
    try{
        let files = fs.readdirSync(dir_path);
        for (let filename of files)
        {
            if (isIgnore(filename) == false)
            {
                let fPath = path.join(dir_path, filename );
                let stats = fs.lstatSync( fPath ); // 同步读取文件信息
                if (stats.isDirectory())
                {
                    loopDir( fPath, path_arr )
                }else
                {
                    if (path.extname( filename ) === ".lua")
                    {
                        path_arr.push(fPath)
                    }
                }
            }
        }
    }catch (error)
    {
        console.log(error)
    }
}

module.exports.search = function ( version, params , finishcallback )
{
    if (!params || params.length < 1)
    {
        finishcallback("param error");
        return;
    }
    let result = "";
    let dirPath = main_dir_path + version + "/Client/Resources/lua";
    let files = [];
    loopDir(dirPath,files);
    console.log("遍历到 " + files.length);
    let __map = new Map();
    let __num = params.length;
    for (let filePath of files)
    {
        let codeContent = fs.readFileSync( filePath,"utf-8");
        let codeArr = codeContent.split("\n");
        for(let i = 0;i < codeArr.length;i++)
        {
            let lineStr = codeArr[i];
            lineStr = lineStr.replace(  /(^\s+)|(\s+$)/g,"");
            if (lineStr.length > 0 && lineStr.indexOf("--") != 0)
            {
                for (let j =0 ;j < __num;j++)
                {
                    let pObj = params[j];
                    if (!pObj.did && pObj.num == (i+1) && lineStr.indexOf( pObj.func) >= 0)
                    {
                        let log = "<p>["+j+"] >>文件路径：<font color='#ff00f0'>" + filePath.split("Client")[1] + "</font><br>";
                           log += "        >> 代码行：<font color='#ff0000'>" + pObj.num + "</font> 方法名：<font color='#0000ff'>" + pObj.func +"</font></p><br>";
                        __map.set(j,log);
                        pObj.did = true;
                        break;
                    }
                }
            }
        }
    }

    for (let i = 0; i < __num; i++) {
        let log = __map.get(i);
        if (log)
        {
            result+= log;
        }
    };
    if (result.length < 1)
    {
        result = "错误，无法找到出错文件";
    }
    finishcallback(result);
};


function searchCode( version , str , lineNum )
{
    let result = "";
    let dirPath = main_dir_path + version + "/Client/Resources/lua";
    let files = [];
    loopDir(dirPath,files);
    let reg = new RegExp(str);
    for (let file of files)
   {
        let codeContent = fs.readFileSync(file,"utf8");

        let codeArr = codeContent.split("\n");
        for(let i = 0;i < codeArr.length;i++)
        {
            let lineStr = codeArr[i];
            lineStr = lineStr.replace(  /(^\s+)|(\s+$)/g,"");
            if (lineStr.length > 0 && lineStr.indexOf("--") != 0)
            {
                if (i == (lineNum-1) &&　lineStr.search(reg)>=0)
                {
                    result += file.split("Client")[1] +"<br>";
                }
            }
        }
   }
   return result;
}

//console.log( searchCode("branch_0.2.0.41.0","pairs",339) )

module.exports.search2 = function ( version, params  )
{
    let handler = function (resolve, reject)
    {
        console.log("dostart")
        if (!params || params.length < 1)
        {
            reject("param error");
        }else
        {
            let dirPath = main_dir_path + version + "/Client/Resources/lua";
            console.log("lua查询目录",dirPath)
            let files = [];
            loopDir(dirPath,files);
            let __map = new Map();
            let __num = params.length;
            if (__num == 1)
            {
                resolve( searchCode( version,params[0].func, params[0].num  ) )
                return;
            }
            console.log("文件总数：",files.length);

            let getFilePath = function * ()
            {
                let i =0;
                while (i < files.length)
                {
                    yield files[i];
                    i++
                }
            };
            let fp = getFilePath();

            let doLoop = function ()
            {
                let info = fp.next();
                if (!info.done)
                {   
                    let filePath = info.value;
                    fs.readFile( filePath ,"utf8",function(err , codeContent )
                    {
                        if (err)
                        {
                            console.log("文件读取失败" + filePath);
                        }
                        else
                        {
                            let codeArr = codeContent.split("\n");
                            for(let i = 0;i < codeArr.length;i++)
                            {
                                let lineStr = codeArr[i];
                                lineStr = lineStr.replace(  /(^\s+)|(\s+$)/g,"");
                                if (lineStr.length > 0 && lineStr.indexOf("--") != 0)
                                {
                                    for (let j =0 ;j < __num;j++)
                                    {
                                        let pObj = params[j];
                                        if (!pObj.did && pObj.num == (i+1) && lineStr.indexOf( pObj.func) >= 0)
                                        {
                                            let log = "<p>["+j+"] >>文件路径：<font color='#ff00f0'>" + filePath.split("Client")[1] + "</font><br>";
                                               log += "        >> 代码行：<font color='#ff0000'>" + pObj.num + "</font> 方法名：<font color='#0000ff'>" + pObj.func +"</font></p><br>";
                                            __map.set(j,log);
                                            pObj.did = true;
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                        doLoop();
                    } );
                }else
                {
                    let result = "";
                    for (let i = 0; i < __num; i++) 
                    {
                        let log = __map.get(i);
                        if (log)
                        {
                            result+= log;
                        }
                    };
                    if (result.length < 1)
                    {
                        result = "错误，无法找到出错文件";
                    }
                    resolve(result);
                }
            }
            doLoop();
        }
    };
    return new Promise(handler)
};

module.exports.getVersionList = function ()
{
    let result = [];
    let files = fs.readdirSync(main_dir_path);
    for (let filename of files)
    {
        if (isIgnore(filename) == false)
        {
            let fPath = path.join(main_dir_path, filename );
            let stats = fs.lstatSync( fPath ); // 同步读取文件信息
            if (stats.isDirectory())
            {
                result.push( filename )
            }
        }
    }
    return result;
};


