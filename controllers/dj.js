/**
 * Created by howe on 2016/12/5.
 */
const path = require("path");

var model = require("../db/Model.js");
var fsPromise = require("../util/fsPromise.js");
var viewtemplate =require("../viewtemplate.js");
const ErrorCode = require("../db/ErrorCode.js");

let handlers = {};

handlers["GET /dj_index.html"] = function *(next)
{
    let content = viewtemplate("dj_index.html");
    content = content.replace("{title}","D");
    this.body = content.replace("{num}",model.getRoomSize());
};


handlers["GET /dj_create.html"] = function *(next)
{
    let content = viewtemplate("dj_create.html");
    content = content.replace("{title}","创建房间");
    let _links =[
        "https://www.ele.me/shop/308563",
        "https://www.ele.me/shop/257376"
    ];
    let _s = "<ul class='outside'>";
    for (let l of _links)
    {
        _s += "<li>" + l + "</li>";
    }
    _s += "</ul>";
    content = content.replace("{links}",_s);
    this.body = content;
};

 /**发送创建房间的请求 **/
handlers["GET /dj/create"] = function*(next)
{
    let req = this.request;
    let roomId = req.query["id"];
    let _data = req.query["roomInfo"];

    if (!roomId || !_data)
    {
        this.body = ErrorCode.ERROR_PARAM_ERROR;
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

handlers["GET /dj_room.html"] = function*(next)
{
    let req = this.request;
    let roomId = req.query["id"];
    if (roomId && /^\d{6}$/.test(roomId))
    {
        try {
            let exist = yield model.isRoomExist(roomId);
            if (exist)
            {
                let content = viewtemplate("dj_room.html");
                content = content.replace("{title}","NO." + roomId);
                content = content.replace("{roomId}",roomId);
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
handlers["GET /dj/get_room"] = function*(next)
{
    let req = this.request;
    let roomId = req.query["id"];
    if (roomId && /^\d{6}$/.test(roomId))
    {
        try {
            let roomObj = yield model.getRoom(roomId);
            this.status = 200;
            this.body = (new Buffer( JSON.stringify( roomObj ) ).toString('base64'));
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

/**发送进入房间的请求 **/
handlers["GET /dj/check_room"] = function*(next)
{
    let req = this.request;
    let roomId = req.query["id"];
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
handlers["GET /dj/addUser"] = function*(next)
{
    let req = this.request;
    let roomId = req.query["id"];
    let _data = req.query["userInfo"];
    let ip = req.query["ip"];
    // base64解码
    let userInfoStr = new Buffer(_data, 'base64').toString();
    try {
        let userObj = JSON.parse(userInfoStr);
        userObj.ip = ip;
        yield model.addUser(roomId, userObj);

    }catch (error)
    {
        this.status = 405;
        this.body = viewtemplate("error.html").replace("{error}",error);
    }
};

module.exports = handlers;