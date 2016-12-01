/**
 * Created by howe on 2016/11/26.
 */
const PRE_FIX = "/dinner";
const path = require("path");

var model = require("./db/Model.js");
var fsPromise = require("./util/fsPromise.js");
var viewtemplate =require("./viewtemplate.js");

module.exports = function (router)
{
    // 请求主界面 /dinner
    router.get(`${PRE_FIX}/index`, function *(next)
    {
        let content =  viewtemplate("index.html");
        content = content.replace("{title}","D");
        this.body = content.replace("{roomNum}",model.getRoomSize());
    });

    // 创建房间界面/dinner/create
    router.get(`${PRE_FIX}/create`,function *(next)
    {
        let content =  viewtemplate("room_create.html");
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
    });

    // 进入房间
    router.get(`${PRE_FIX}/:id`,function *(next)
    {
        let roomId = this.params.id;
        if (/^\d{6}$/.test(roomId))
        {
            let content =  viewtemplate("room.html");
            this.body = content.replace("{title}","NO." + roomId);
        }else
        {
            return yield next
        }
    });

    // 提交订单
    router.post(`${PRE_FIX}/submit`,function *(next)
    {
        this.body = this.params + " Page";
    });

    // 查看房间当前情况
    router.get(`${PRE_FIX}/:id/fuck`,function *(next)
    {
        this.body = this.params.id + " fuck Page";
    });

};
