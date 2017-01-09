/**
 * Created by howe on 2016/12/5.
 */
const path = require("path");
const config = require('../__config.js');

var model = require("../db/Model.js");
var fsPromise = require("../util/fsPromise.js");
var viewtemplate =require("../viewtemplate.js");
const ErrorCode = require("../db/ErrorCode.js");
let IpLock = require("../util/ipLock.js");

let handlers = {};

handlers["GET /wf_index.html"] = function *(next)
{
    let content = viewtemplate("wf_index.html");
    content = content.replace("{title}","D");
    this.body = content.replace("{num}",model.getRoomSize());
};

handlers["GET /wf_create.html"] = function *(next)
{
    let content = viewtemplate("wf_create.html");
    content = content.replace("{title}","创建房间");
    let _links =[
        "https://www.ele.me/shop/308563",
        "https://www.ele.me/shop/257376"
    ];
    let _s = "<ul>";
    for (let l of _links)
    {
        _s += "<li>" + l + "</li>";
    }
    _s += "</ul>";
    content = content.replace("{links}",_s);
    this.body = content;
};

 /**发送创建房间的请求 **/
handlers["GET /wf/create"] = function*(next)
{
    let req = this.request;
    let ip = req["ip"];
    if (!IpLock( req.url, ip, 2000 ))
    {
        this.status = 405;
        this.body = ErrorCode.ERROR_REQUEST_FREQUENT;
        return
    }

    let roomId = req.query["id"];
    let _data = req.query["roomInfo"];

    if (!roomId || !_data)
    {
        this.status = 405;
        this.body = ErrorCode.ERROR_PARAM_ERROR;
        return;
    }
    let exist = yield model.isRoomExist(roomId);
    if (exist)
    {
        this.status = 405;
        this.body = ErrorCode.ERROR_ROOM_HAD_EXIST;
        return;
    }
    // base64解码
    let roomInfoStr = new Buffer(_data, 'base64').toString();
    if (roomId && /^\d{6}$/.test(roomId))
    {
        try {
            let roomObj = JSON.parse(roomInfoStr);
            yield model.createRoom(roomObj);
            this.status = 200;
            this.body = ErrorCode.SUCCESS_CREATE_ROOM;

        }catch (error)
        {
            this.status = 405;
            this.body = error
        }
    }else
    {
        this.status = 405;
        this.body = ErrorCode.ERROR_ROOMID_FORMAT_ERROR;
    }
};

handlers["GET /wf_room.html"] = function*(next)
{
    let req = this.request;
    let roomId = req.query["id"];
    if (roomId && /^\d{6}$/.test(roomId))
    {
        try {
            let exist = yield model.isRoomExist(roomId);
            if (exist)
            {
                let roomObj = yield model.getRoom(roomId);
                let content = viewtemplate("wf_room.html");
                content = content.replace("{title}","NO." + roomId);
                content = content.replace("{roomId}",roomId);
                content = content.replace("{roomId}",roomId);
                content = content.replace("{shopName}",roomObj.title);
                content = content.replace("{shopLink}",roomObj.link);
                content = content.replace("{menuNum}",roomObj.list.length);

                this.body = content;
            }else
            {
                this.body = viewtemplate("error.html").replace("{error}",ErrorCode.ERROR_NOT_FOUND_ROOM);
            }
        }catch (error)
        {
            this.body = viewtemplate("error.html").replace("{error}",error);
        }
    }else
    {
        this.body = viewtemplate("error.html").replace("{error}", ErrorCode.ERROR_ROOMID_FORMAT_ERROR);
    }
};

handlers["GET /wf_userList.html"] = function*(next)
{
    let req = this.request;
    let roomId = req.query["id"];
    if (roomId && /^\d{6}$/.test(roomId))
    {
        try {
            let exist = yield model.isRoomExist(roomId);
            if (exist)
            {
                let content = viewtemplate("wf_userList.html");
                content = content.replace("{title}",roomId);

                this.body = content;
            }else
            {
                this.body = viewtemplate("error.html").replace("{error}",ErrorCode.ERROR_NOT_FOUND_ROOM);
            }
        }catch (error)
        {
            this.body = viewtemplate("error.html").replace("{error}",error);
        }
    }else
    {
        this.body = viewtemplate("error.html").replace("{error}", ErrorCode.ERROR_ROOMID_FORMAT_ERROR);
    }
};

/** 获取房间信息 **/
handlers["GET /wf/get_room"] = function*(next)
{
    let req = this.request;
    let roomId = req.query["id"];
    let ip = req["ip"];
    if (!IpLock( req.url, ip, 1000 ))
    {
        this.status = 405;
        this.body = ErrorCode.ERROR_REQUEST_FREQUENT;
        return;
    }

    if (roomId && /^\d{6}$/.test(roomId))
    {
        try {
            let roomObj = yield model.getRoom(roomId);
            this.status = 200;
            this.body = (new Buffer( JSON.stringify( roomObj ) ).toString('base64'));
        }catch (error)
        {
            this.status = 405;
            this.body = error.toString();
        }
    }else
    {
        this.status = 405;
        this.body = ErrorCode.ERROR_ROOMID_FORMAT_ERROR;
    }
};
/**发送进入房间的请求 **/
handlers["GET /wf/check_room"] = function*(next)
{
    let req = this.request;
    let roomId = req.query["id"];
    let ip = req["ip"];
    if (!IpLock( req.url, ip, 1000 ))
    {
        this.status = 405;
        this.body = ErrorCode.ERROR_REQUEST_FREQUENT;
        return;
    }

    if (roomId && /^\d{6}$/.test(roomId))
    {
        try {
            let _o = yield model.getRoom(roomId);
            this.status = 200;
            this.body = "success!";

        }catch (error)
        {
            this.status = 405;
            this.body = error;
        }
    }else
    {
        this.status = 405;
        this.body = ErrorCode.ERROR_ROOMID_FORMAT_ERROR;
    }
};
//增加一个订单
handlers["GET /wf/addUser"] = function*(next)
{
    let req = this.request;
    let roomId = req.query["id"];
    let _data = req.query["userInfo"];
    let ip = req["ip"];
    if (!IpLock( req.url, ip, 1000 ))
    {
        this.status = 405;
        this.body = ErrorCode.ERROR_REQUEST_FREQUENT;
        return;
    }
    // base64解码
    let userInfoStr = new Buffer(_data, 'base64').toString();
    try {
        let userObj = JSON.parse(userInfoStr);
        userObj.ip = ip;
        console.log("增加一个用户订单",userObj);
        yield model.addUser(roomId, userObj);
        this.status = 200;
        this.body = "success!";
    }catch (error)
    {
        this.status = 405;
        this.body = error;
        console.log("error",error)
    }
};

handlers["GET /wf/removeUser"] = function *(next)
{
    let req = this.request;
    let ip = req["ip"];
    if (ip !== config.SERVER_IP)
    {
        this.body = "只允许在服务器上做删除操作！";
        return;
    }
    try
    {
        yield model.removeUser(req);
        this.status = 200;
        this.body = "success";
    }catch (e)
    {
        this.status = 405;
        this.body = e;
    }
};

handlers["GET /wf/getUsers"] = function*(next)
{
    let req = this.request;
    let roomId = req.query["id"];
    let ip = req["ip"];
    try
    {
        let users = yield model.getUsers(roomId);
        this.status = 200;
        this.body = (new Buffer( JSON.stringify( users ) ).toString('base64'));
    }catch(e)
    {
        this.status = 405;
        this.body = e;
    }
};

module.exports = handlers;