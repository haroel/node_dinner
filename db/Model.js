/**
 * Created by howe on 2016/11/26.
 */
const fsPromise = require("./../util/fsPromise.js");
const easy_co = require("./../util/easy_co.js");
const $lib = require("./../util/$lib.js");
const ErrorCode = require("./ErrorCode.js");

const path = require("path");

const ROOMS = "rooms";
const ROOM_STATIC_JSON = "room.json";
const ROOM_USER_JSON = "users.json";

const CD_Time = 10 * 60 * 1000; // 每个账号只能10分钟改一次
const MAX_ROOM_SIZE = 10;
let model = {};

model.roomSets = new Set();

model.cachePageHash = new Map();

model.init = ()=>
{
    let _init = function *()
    {
        let exist = yield fsPromise.exists( path.join(__dirname, ROOMS ) );
        if (!exist)
        {
            yield fsPromise.mkdir(path.join(__dirname, ROOMS ));
        }
        let files = yield fsPromise.readdir(path.join(__dirname, ROOMS ));
        for(let f of files)
        {
            if ( /^\d+$/.test(f) )
            {
                model.roomSets.add(f);
            }
        }
        console.log("当前房间", model.roomSets );
    };
    easy_co(_init());
    //easy_co(model.createRoom({
    //    id :"547887",
    //    url:"https://www.ele.me/shop/308563"
    //}));
};

model.setCachePage = function (roomId, pageData) {
    model.cachePageHash.set(roomId,pageData);
};

model.getRoomSize = function ()
{
    return model.roomSets.size;
};

model.isRoomExist = function *(roomId) {

    let roomDir = path.join(__dirname, ROOMS ,roomId);
    let exist = yield fsPromise.exists(roomDir);
    return exist;
};

model.createRoom = function* ( info )
{
    if (model.getRoomSize() > MAX_ROOM_SIZE)
    {
        return Promise.reject(ErrorCode.ERROR_ROOM_MAX_SIZE);
    }
    let roomId = info.id;
    let __url = info.url;
    let desc = info.desc || "*";
    let validTime = parseInt(info.validTime); // 单位秒

    console.log("创建房间号",roomId);
    if (model.roomSets.has(roomId))
    {
        return Promise.reject(ErrorCode.ERROR_ROOM_HAD_EXIST);
    }
    let roomDir = path.join(__dirname, ROOMS ,roomId);
    let exist = yield fsPromise.exists(roomDir);
    if (exist)
    {
        yield model.removeRoom(roomId);
        return Promise.reject(ErrorCode.ERROR_ROOM_HAD_EXIST);
    }

    let pageObj = {};
    if (model.cachePageHash.has(roomId))
    {
        pageObj = model.cachePageHash.get(roomId);
    }else
    {
        try
        {
            pageObj = yield easy_co($lib.getEleList(__url) );
        } catch(e)
        {
            return Promise.reject(e);
        }
    }
    if (pageObj.list.length < 1)
    {
        return Promise.reject(ErrorCode.ERROR_ROOMID_LINK_ERROR);
    }
    pageObj.desc = desc;
    pageObj.createTime = "" + Date.now();             // 豪秒
    pageObj.endTime = "" + (Date.now() + validTime); // 结束时间

    yield fsPromise.mkdir(roomDir);
    //创建room.json
    let roomobj = pageObj;
    let roomJsonPath = path.join(roomDir,ROOM_STATIC_JSON);
    yield fsPromise.writeFile(roomJsonPath, JSON.stringify(roomobj),"utf8");

    let userobj = {
        list:[],
        endTime:pageObj.endTime
    };
    let userJsonPath = path.join(roomDir,ROOM_USER_JSON);
    yield fsPromise.writeFile(userJsonPath, JSON.stringify(userobj),"utf8");
    model.roomSets.add(roomId);
    console.log(`创建成功 ${roomId} , ${pageObj.title} 共有 ${pageObj.list.length}个订单`);
};

model.addUser = function * (id,userInfo) {
    let userobj = yield model.getUsers(id);
    let obj = null;
    let sameIpNum =0;
    for (var uu of userobj.list)
    {
        /**同一个人名十分钟只能提交一次**/
        if ( uu.name === userInfo.name )
        {
            let delayTime = Date.now() - parseInt( uu.lastDate );
            let __dd = (CD_Time - delayTime)/1000;
            if (__dd > 3)
            {
                return Promise.reject(ErrorCode.ERROR_USER_HAD_BOOK + `,请在${ Math.ceil( __dd/60 )}分钟后重试` );
            }
            obj = uu;
            break;
        }
        if (uu.ip == userInfo.ip)
        {
            ++sameIpNum;
        }
    }
    if (sameIpNum >= 2)
    {
        return Promise.reject(ErrorCode.ERROR_ROOMID_IP_ERROR);
    }
    // 新增用户订单
    if (!obj)
    {
        obj = {};
        userobj.list.push(obj);
    }
    obj.name = userInfo.name;
    obj.ip = userInfo.ip;
    obj.menuId = userInfo.menuId;
    obj.desc = userInfo.desc;
    obj.lastDate = Date.now();
    userobj.changeDate = Date.now();

    let userJsonPath = path.join(__dirname, ROOMS ,id,ROOM_USER_JSON);
    //console.log("写入订单" + obj.menuId);
    yield fsPromise.writeFile(userJsonPath, JSON.stringify(userobj),"utf8");

};

model.getUsers = function * (id )
{
    let userJsonPath = path.join(__dirname, ROOMS ,id,ROOM_USER_JSON);
    let exist = yield fsPromise.exists( userJsonPath );
    if (!exist)
    {
        return Promise.reject(ErrorCode.ERROR_NOT_FOUND_ROOM);
    }
    let data = yield fsPromise.readFile( userJsonPath ,"utf8" );
    if (data)
    {
        let userobj= JSON.parse(data);
        if ( parseInt( userobj.endTime ) <= Date.now())
        {
            yield model.removeRoom(id);
            return Promise.reject(ErrorCode.ERROR_ROOM_TIME_INVALID);
        }
        return userobj;
    }
    return Promise.reject(ERROR_DATA_ERROR + 101);
};

model.removeRoom = ( id ) =>
{
    let roomDir = path.join(__dirname, ROOMS,id);
    model.roomSets.delete(id);
    model.cachePageHash.delete(id);
    return fsPromise.rename(roomDir,path.join(__dirname, ROOMS,"_"+id));
    //return fsPromise.removeFile(roomDir)
};

model.getRoom = function * (id,string_mode)
{
    let roomJsonPath = path.join(__dirname, ROOMS ,id,ROOM_STATIC_JSON);
    let exist = yield fsPromise.exists( roomJsonPath );
    if(!exist)
    {
        return Promise.reject(ErrorCode.ERROR_NOT_FOUND_ROOM);
    }
    let data = yield fsPromise.readFile( roomJsonPath ,"utf8" );
    if (data)
    {
        try{
            let obj= JSON.parse(data);
            let _pTime = parseInt(obj.endTime);
            if ( _pTime <= Date.now())
            {
                yield model.removeRoom(id);
                return Promise.reject(ErrorCode.ERROR_ROOM_TIME_INVALID);
            }
            obj.leftTime = _pTime - Date.now();
            return obj;
        }
        catch(e)
        {
            console.log(e);
            Promise.reject(ErrorCode.ERROR_DATA_ERROR);
        }
    }
    return Promise.reject(ErrorCode.ERROR_DATA_ERROR);
};
//
//model.getRoom11 = (id)=>
//{
//    let _roomPath = path.join(__dirname, ROOMS ,id,ROOM_STATIC_JSON);
//    let p = fsPromise.exists( _roomPath )
//        .then((exists)=>
//        {
//            if (exists)
//            {
//                return fsPromise.readFile( _roomPath ,"utf8" );
//            }else
//            {
//                console.log(`model.getRoom ${_roomPath} 文件不存在`);
//                return Promise.reject( `${_roomPath} 文件不存在`);
//            }
//        })
//        .then((data)=>
//        {
//            try{
//                let obj= JSON.parse(data);
//                return obj;
//            }catch(e)
//            {
//                return Promise.reject(e);
//            }
//        });
//    return p;
//};
model.init();
module.exports = model;