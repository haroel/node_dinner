/**
 * Created by howe on 2017/1/11.
 */
let trace = console.log;

const socketIO = require("socket.io");

//事件类型
var EVENT =
{
    CONNECTION:"connection",

    // 用户产生的事件类型
    USER_MESSAGE:"user_message",
    USER_IMAGE:"user_image",
    USER_LOGIN:"user_login", // 用户Login
    USER_DISCONNECT:"disconnect",

    USER_REVOKE_MESSAGE:"user_revoke",

    // 发回给客户端的事件类型
    PUSH_USER_LOGIN_SUCCESS:"push_user_login_success", // 用户Login
    PUSH_USER_EXISTED:"push_user_existed", // 用户名已存在
    PUSH_MESSAGE:"push_message",
    PUSH_REVOKE_MESSAGE:"push_revoke_message",
    PUSH_MESSAGE_SEND_SUCCESS:"push_message_send_success",

    // 客户端的事件
    CLIENT_FILE_ERROR:"client_file_error",

    CLIENT_SOCKET_CONNECT:"connect",
    CLIENT_SOCKET_DISCONNECT:"disconnect",
    CLIENT_SOCKET_ERROR:"error"
};

// 消息体类型
var MESSAGE =
{
    TEXT:"text",
    SYSTEM:"system",
    IMAGE:"image",
    OTHER:"other"
};

// 事件动作
var ACTION = {
    LOGIN:"login",
    LOGIN_OUT:"login_out",
    REVOKE:"revoke"
};



let __gen_chat_uuid  = (function () {
    let _chat_id = 0;
    return function ( name ) {
        return "chat_" +  name + "_" + (_chat_id++);
    }
})();

let roomInfos = new Map();

// 初始化聊天服务器
function init( server)
{
    let io = socketIO.listen(server);
    io.on(EVENT.CONNECTION, (socket)=>
    {
        trace("io 连接成功",socket.id);
        _doWithClientSocket(io,socket);
    });
}

function addRoomChat(roomId)
{
    let roomInfo = {};
    roomInfo.userMap = new Map();
    roomInfo.msgList = [];
    roomInfos.set(roomId,roomInfo);
    trace("创建一个聊天房间:",roomId);
}

function removeRoomChat(roomId)
{
    roomInfos.delete(roomId);
    trace("删除聊天房间:",roomId);
}

function _getIpFromSocket(socket)
{
    let clientIp=socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
    if ( clientIp instanceof Array)
    {
        clientIp = clientIp[0];
    }
    return clientIp
}

function _createChatMsg( info ,socket )
{
    //trace(socket)
    let msgObj = info;
    //let d = new Date();
    //function p(s) {
    //    return s < 10 ? '0' + s: s;
    //}
    //let time = `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
    msgObj.time = Date.now();
    msgObj.ip = _getIpFromSocket(socket);
    msgObj.nickname=socket.nickname;
    msgObj.index=socket.userIndex;
    msgObj.uuid = __gen_chat_uuid( msgObj.nickname );
    return msgObj;
}

function _doWithClientSocket(io,socket)
{
    socket.on( EVENT.USER_LOGIN, (data)=>
    {
        let roomId = data.roomId;
        if (!roomInfos.has(roomId))
        {
            addRoomChat(roomId);
        }
        let nickname = data.nickname;
        let roomInfo = roomInfos.get(roomId);
        let userMap = roomInfo.userMap;
        let msgList = roomInfo.msgList;
        let ip = _getIpFromSocket(socket);

        for (let [_id , _socket] of userMap)
        {
            if (_socket.nickname === nickname && _socket.ip === ip )
            {
                socket.emit( EVENT.PUSH_USER_EXISTED );
                return;
            }
        }
        socket.join(roomId); // 分组

        socket.userIndex = userMap.size;
        socket.nickname = nickname;
        socket.roomId = roomId;
        socket.ip = ip;

        userMap.set(socket.id, socket);

        // 第一次登录发送历史消息记录 ,最多只给他显示10条最近的消息记录
        socket.emit(EVENT.PUSH_USER_LOGIN_SUCCESS,msgList.slice(-10),_getIpFromSocket(socket));

        let msgObj = _createChatMsg(
            {type: MESSAGE.SYSTEM,
                action:ACTION.LOGIN,
                num:userMap.size
            },socket );
        roomInfo.msgList.push(msgObj);

        io.sockets.in(roomId).emit(EVENT.PUSH_MESSAGE, msgObj);
        trace(nickname + "登录聊天室" + roomId)

    });
    // 断开连接的事件
    socket.on( EVENT.USER_DISCONNECT, (data)=>
    {
        let roomId = socket.roomId;
        let roomInfo = roomInfos.get( roomId );
        if (!roomInfo)
        {
            return;
        }
        let userMap = roomInfo.userMap;

        userMap.delete(socket.id);
        trace( socket.nickname + " 退出聊天 " + roomId);

        let msgObj = _createChatMsg(
            { type: MESSAGE.SYSTEM,
                action:ACTION.LOGIN_OUT,
                num:userMap.size
            },socket );
        roomInfo.msgList.push(msgObj);

        io.sockets.in(roomId).emit(EVENT.PUSH_MESSAGE, msgObj);
        // 如果都退出则关闭
        if (userMap.size < 1)
        {}
    });

    socket.on( EVENT.USER_MESSAGE, (data)=>
    {
        //trace("收到消息");
        let roomId = socket.roomId;
        let roomInfo = roomInfos.get( roomId );
        if (!roomInfo)
        {return;}
        let msgObj = _createChatMsg(
            { type: MESSAGE.TEXT,
                msg:data.msg,
                _uuid:data._uuid
            },socket );

        roomInfo.msgList.push(msgObj);
        // 把信息发送给除我之外的所有连接用户
        socket.broadcast.to(roomId).emit(EVENT.PUSH_MESSAGE,msgObj);
        // 通知发送者该条消息已转发
        socket.emit(EVENT.PUSH_MESSAGE_SEND_SUCCESS, {uuid:msgObj.uuid,_uuid:data._uuid} );

    });

    socket.on( EVENT.USER_IMAGE, (data)=>
    {
        trace("收到消息",EVENT.USER_IMAGE);
        let roomId = socket.roomId;
        let roomInfo = roomInfos.get( roomId );
        if (!roomInfo)
        {return;}
        let msgObj = _createChatMsg(
            { type: MESSAGE.IMAGE,
                msg:data.msg,
                _uuid:data._uuid // 标记是客户端生成的uuid
            },socket );
        roomInfo.msgList.push(msgObj);
        // 把图片信息发送给除我之外的所有连接用户
        socket.broadcast.to(roomId).emit(EVENT.PUSH_MESSAGE,msgObj);
        // 通知发送者该条消息已转发
        socket.emit(EVENT.PUSH_MESSAGE_SEND_SUCCESS, {uuid:msgObj.uuid,_uuid:data._uuid} );
    });

    // 消息撤回
    socket.on( EVENT.USER_REVOKE_MESSAGE, (data)=>
    {
        trace("收到消息",EVENT.USER_REVOKE_MESSAGE);
        let roomId = socket.roomId;
        let roomInfo = roomInfos.get( roomId );
        if (!roomInfo)
        {return;}
        let msgList = roomInfo.msgList;
        let _uuid = data._uuid;

        let len = msgList.length;
        for (let i = 0;i < len;i++)
        {
            if (msgList[i]._uuid === _uuid || msgList[i].uuid === _uuid )
            {

                let msgObj = _createChatMsg(
                    { type: MESSAGE.SYSTEM,
                        action:ACTION.REVOKE,
                        revoke_uuid: msgList[i].uuid // 标记是客户端生成的uuid
                    },socket );

                msgList.splice(i,1,msgObj);
                io.sockets.in(roomId).emit(EVENT.PUSH_REVOKE_MESSAGE, msgObj);
                trace("消息撤回成功",_uuid);
                break;
            }
        }
    });

}

let handler = {};
handler.init = init;
handler.addRoomChat = addRoomChat;
handler.removeRoomChat = removeRoomChat;

module.exports = handler;