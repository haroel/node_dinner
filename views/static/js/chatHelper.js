/**
 * Created by howe on 2017/1/12.
 */
//事件类型
var EVENT =
{
    CONNECTION:"connection",

    // 用户产生的事件类型
    USER_MESSAGE:"user_message",
    USER_IMAGE:"user_image",
    USER_LOGIN:"user_login", // 用户Login
    USER_DISCONNECT:"disconnect",

    // 发回给客户端的事件类型
    PUSH_USER_LOGIN_SUCCESS:"push_user_login_success", // 用户Login
    PUSH_USER_EXISTED:"push_user_existed", // 用户名已存在
    PUSH_MESSAGE:"push_message",

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
    LOGIN_OUT:"login_out"
};

var roomId = roomId;
var ChatController = function () {
    this.socket = null;
    this.clientIp = "";
    this.isshowGif = false;
};
ChatController.prototype.init = function()
{
    console.log("socket.io 初始化");
    var that = this;
    this.socket = io.connect();
    this.socket.on(EVENT.CLIENT_SOCKET_CONNECT, function()
    {
        $("#chat_loginWrapper").css("display","block");
        $("#chat_login").css("display","block");
        $("#info").html("输入一个昵称!");
        $("#nickNameInput").focus();

        console.log("socket 连接成功");
        hideGif();
    });
    this.socket.on(EVENT.CLIENT_SOCKET_ERROR, function(err) {
        alert("socket 错误. " + err.toString());

        hideGif();
    });
    this.socket.on(EVENT.CLIENT_SOCKET_DISCONNECT, function(err) {
        alert("与聊天服务器断开连接,服务器可能已经关闭");

        hideGif();
    });
    this.socket.on( EVENT.PUSH_USER_EXISTED, function()
    {
        $("#info").html("昵称已存在!");
    });

    this.socket.on(EVENT.PUSH_USER_LOGIN_SUCCESS , function(msgList,ip,num)
    {
        that.clientIp = ip;
        $("#chat_loginWrapper").css("display","none");
        $("#chat_login").css("display","none");

        $("#chat_nickname").html(controller.nickname);
        that.showHistroyMsgList(msgList);

        hideGif();
    });
    // 收到消息
    this.socket.on(EVENT.PUSH_MESSAGE , function(msgObj)
    {
        that.appendMsg(msgObj);
    });

    //监听 ctrl+enter发送
    $("#messageInput").ctrlSubmit(function(event){
        //提交代码写在这里
        sendMessage();
    });
};

ChatController.prototype.showHistroyMsgList = function(msgList)
{
    for(var i =0;i<msgList.length;i++)
    {
        this.appendMsg(msgList[i]);
    }
};

ChatController.prototype.appendMsg = function( data )
{
    var msg ="";
    switch (data.type)
    {
        case MESSAGE.SYSTEM:
        {
            msg = this["chat_item_sys"];
            msg=msg.replace("{nickname}",data.nickname);
            msg=msg.replace("{time}",data.time);
            switch (data.action)
            {
                case ACTION.LOGIN:
                {
                    msg=msg.replace("{action}","加入群聊");
                    $("#chat_num").html( "(在线:" + data.num +"人)" );
                    break;
                }
                case ACTION.LOGIN_OUT:
                {
                    msg=msg.replace("{action}","退出群聊");
                    $("#chat_num").html( "(在线:" + data.num +"人)" );
                    break;
                }
            }
            break;
        }
        case MESSAGE.TEXT:
        {
            if (data.ip === this.clientIp)
            {
                msg=msg = this["chat_item_right"];
            }else
            {
                msg=msg = this["chat_item_left"];
            }
            msg=msg.replace("{nickname}",data.nickname);
            msg=msg.replace("{time}",data.time);
            msg=msg.replace("{ip}",data.ip);
            msg=msg.replace("{content}",data.msg);

            //判断内容里有没有emoji字符
            var reg = /\[emoji\:(\d+)\]/gm;
            if (reg.test(msg))
            {
                msg = msg.replace(reg, function (match, index)
                {
                    var __img = '<img class="emoji" src="static/emoji/4520/' + index + '.gif" />';
                    return __img;
                } )
            }
            break;
        }
        case MESSAGE.IMAGE:
        {
            if (data.ip === this.clientIp)
            {
                msg=msg = this["chat_item_right"];
            }else
            {
                msg=msg = this["chat_item_left"];
            }
            msg=msg.replace("{nickname}",data.nickname);
            msg=msg.replace("{time}",data.time);
            msg=msg.replace("{ip}",data.ip);
            var imageData = data.msg;
            var imageSize = data.size;
            var _s = "";
            //if (imageSize.width > 400)
            //{
            //    var s = 400/imageSize.width;
            //    _s = 'width="' + 400 + '" height="' + imageSize.height * s + '" ';
            //}
            msg=msg.replace("{content}", '<img '+_s+' src="' + imageData + '"/>'  );
            break;
        }
        case MESSAGE.OTHER:
        {
            msg = data.msg;
            break;
        }
        default :
        {break;}
    }
    var chatContent = $("#chat_content");
    chatContent.append(msg);
    chatContent.scrollTop(chatContent[0].scrollHeight);
};

ChatController.prototype.initView = function ()
{
    var that = this;
    this["chat_item_left"] = $(".chat_item_left").prop("outerHTML");
    this["chat_item_sys"] = $(".chat_item_sys").prop("outerHTML");
    this["chat_item_right"] = $(".chat_item_right").prop("outerHTML");
    $("#chat_content").html("");

    // 初始化表情
    var emojiContainer = document.getElementById('emojiWrapper'),
        docFragment = document.createDocumentFragment();
    for (var i = 62; i > 0; i--) {
        var emojiItem = document.createElement('img');
        var t = (i < 10)? "0" + i:i;
        emojiItem.src = 'static/emoji/4520/' + t + '.gif';
        emojiItem.title = t;
        docFragment.appendChild(emojiItem);
    }
    emojiContainer.appendChild(docFragment);
    document.getElementById('emojiWrapper').addEventListener('click', function(e) {
        var target = e.target;
        if (target.nodeName.toLowerCase() == 'img') {
            var messageInput = document.getElementById('messageInput');
            messageInput.focus();
            messageInput.value = messageInput.value + '[emoji:' + target.title + ']';
        }
    }, false);

    var _sendError = function (errorStr)
    {
        that.appendMsg({
            type:MESSAGE.OTHER,
            msg:"<p class='chat_error'>错误，"+errorStr+"</p>"
        });
    };
    $("#chat_img").change(function ()
    {
        if (this.files.length != 0) {
            var file = this.files[0];
            if (file.size > 1024 * 1024)
            {
                _sendError("请选择小于1MB的图片文件！");
                return;
            }
            var reg = /gif|png|jpg|jpeg/;
            if ( !reg.test( file.name )  )
            {
                _sendError("请选择图片文件！");
                return;
            }
            var reader = new FileReader();
            if (!reader) {
                _sendError("该浏览器不支持文件读取操作！");
                return;
            }
            reader.onload = function(e) {
                var _imgData = e.target.result;
                if (_imgData.indexOf("image") > 0)
                {
                    that.socket.emit(EVENT.USER_IMAGE, _imgData );

                    that.appendMsg({
                        type:MESSAGE.IMAGE,

                        time:g.getTime0(),
                        nickname:that.nickname,
                        ip:that.clientIp,
                        msg:_imgData
                    })
                }else
                {
                    _sendError("请选择图片文件！");
                }
            };
            reader.readAsDataURL(file);
        }
    })
};

//*********************************************

var controller = new ChatController();
controller.init();
controller.initView();

// 登录聊天
function loginChat()
{
    var nickname = $("#nickNameInput")[0].value;
    if (!nickname )
    {
        infoDialog("请输入昵称");
        return;
    }
    controller.nickname = nickname;
    // 登录消息发送至服务器 , 数据包括聊天室房号
    controller.socket.emit( EVENT.USER_LOGIN , {roomId:roomId,nickname:nickname} );
}

// 发送聊天信息
function sendMessage()
{
    hideGif();
    var messageStr = $("#messageInput").val();
    if (!messageStr )
    {
        infoDialog("请输入聊天信息");
        return;
    }
    // 聊天信息发送到服务器
    controller.socket.emit(EVENT.USER_MESSAGE, {msg:messageStr} );
    controller.appendMsg({
        type:MESSAGE.TEXT,

        time:g.getTime0(),
        nickname:controller.nickname,
        ip:controller.clientIp,
        msg:messageStr
    });
    $("#messageInput").val("");
}

function showGif()
{
    if (controller.isshowGif)
    {
        $("#emojiWrapper").css("display","none");
    }else
    {
        $("#emojiWrapper").css("display","block");
    }
    controller.isshowGif = !controller.isshowGif;
}

function hideGif()
{
    controller.isshowGif = false;
    $("#emojiWrapper").css("display","none");
}

function _sendImg()
{
    $("#chat_img").click();
}