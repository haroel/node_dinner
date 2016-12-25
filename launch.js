/**
 * Created by howe on 2016/12/24.
 */
let getLocalIP = function (){
    var interfaces = require('os').networkInterfaces();
    for(var devName in interfaces){
        var iface = interfaces[devName];
        for(var i=0;i<iface.length;i++){
            var alias = iface[i];
            if(alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal){
                return alias.address;
            }
        }
    }
};

let config = require("./__config.js");
config.SERVER_IP = getLocalIP();

require("./index.js");