/**
 * Created by howe on 2017/1/11.
 */
let trace = console.log;

const socketIO = require("socket.io");

const EVENT =
{
    CONNECTION:"connection",

    POST_MESSAGE:"post_message",

    MESSAGE:"message",
    SYSTEM:"system",

    USER_LOGIN:"user_login", // 用户Login
    USER_LOGIN_SUCCESS:"user_login_success", // 用户Login
    USER_EXISTED:"user_existed", // 用户名已存在

    USER_DISCONNECT:"disconnect"
};

const E_TYPE = {
    LOGIN:"login",

    LOGIN_OUT:"login_out"
};

let roomInfos = new Map();

// 初始化聊天服务器
function init( server)
{
    let io = socketIO.listen(server);
    io.on(EVENT.CONNECTION, (socket)=>
    {
        trace("io 连接成功");
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

        if ( userMap.has(nickname) )
        {
            socket.emit(EVENT.USER_EXISTED);
        }else
        {
            socket.join(roomId); // 分组

            socket.userIndex = userMap.size;
            socket.nickname = nickname;
            socket.roomId =
            userMap.set(socket.id, socket);

            // 第一次登录发送历史消息记录
            socket.emit(EVENT.USER_LOGIN_SUCCESS,msgList);

            io.sockets.in(roomId).emit(EVENT.SYSTEM, {
                type: E_TYPE.LOGIN ,
                nickname:socket.nickname,
                index:socket.userIndex
            });
        }
    });
    // 断开连接的事件
    socket.on( EVENT.USER_DISCONNECT, (data)=>
    {
        let roomId = socket.roomId;
        let roomInfo = roomInfos.get( roomId );
        let userMap = roomInfo.userMap;

        userMap.delete(socket.id);
        trace( socket.nickname + " 退出聊天房间 " + roomId);
        io.sockets.in(roomId).emit(EVENT.SYSTEM, {
            type: E_TYPE.LOGIN_OUT ,
            nickname:socket.nickname,
            index:socket.userIndex
        });
        // 如果都退出则关闭
        if (userMap.size < 1)
        {

        }
    });

    socket.on( EVENT.POST_MESSAGE, (data)=>
    {
        let roomId = socket.roomId;
        let roomInfo = roomInfos.get( roomId );
        let clientIp=socket.handshake.headers['x-forwarded-for'] || socket.handshake.address.address;
        if ( clientIp instanceof Array)
        {
            clientIp = clientIp[0];
        }
        //通知除自己以外的所有人
        let d = new Date();
        let msgObj = data;
        msgObj.nickname = socket.nickname;
        msgObj.time = d.toLocaleString();
        msgObj.ip = clientIp;
        roomInfo.msgList.push(msgObj);

        socket.broadcast.to(roomId).emit(EVENT.MESSAGE,msgObj)
    });

}

let handler = {};
handler.init = init;
handler.addRoomChat = addRoomChat;
handler.removeRoomChat = removeRoomChat;

module.exports = handler;