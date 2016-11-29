/**
 * Created by howe on 2016/11/26.
 */

const fs = require("fs");
const child_process = require('child_process');
const exec = child_process.exec;

let pfs = {};

let funcs =[
    "readFile",
    "writeFile",
    "appendFile",
    "mkdir",
    "readdir",
    "fstat",
    "exists",
    "rename"
];

for (let funcName of funcs)
{
    pfs[funcName] = (...args)=>
    {
        return new Promise( (resolve,reject)=>
        {
            fs[funcName](...args, (err, data) =>
            {
                if ( err instanceof Error)
                {
                    console.log("fsPromise",funcName,err);
                    reject(err);
                    return;
                }
                if (typeof err === "boolean")
                {
                    resolve(err);
                    return;
                }
                resolve(data);
            });

        });
    };
}

pfs.removeFile = (path)=>
{
    return new Promise((resolve,reject)=>
    {
        exec("rm -rf " + path,function (error)
        {
            if (error)
            {
                reject(error);
            }else
            {
                resolve(true)
            }
        })
    })
};

module.exports = pfs;