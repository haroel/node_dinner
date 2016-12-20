/**
 * Created by howe on 2016/12/20.
 */

let _ipInfoHash = {};

module.exports = function ( tag, ip ,maxInteval)
{
    let ipData = _ipInfoHash[ip];
    if (!ipData)
    {
        ipData = {};
        ipData["tag"] = tag;
        ipData["lastTime"] = Date.now();
        _ipInfoHash[ip] = ipData;
        return true;
    }
    return (Date.now() - ipData["lastTime"]) > maxInteval;
};
