/**
 * Created by howe on 2016/11/26.
 */

var model = require("./db/Model.js");
var fsPromise = require("./util/fsPromise.js");

module.exports = function (router,app)
{
    // 请求主界面 /dinner
    router.get('/', function *(next)
    {
        let content = yield fsPromise.readFile("./views/index.html","utf8");
        this.body = content.replace("{roomNum}",model.getRoomSize());
        console.log("/");
        return yield next
    });

    // 创建房间界面/dinner/create
    router.get('/create',function *(next)
    {
        console.log("create");
        let content = yield fsPromise.readFile("./views/room_create.html","utf8");
        this.body = content;
        return yield next
    });

    // 进入房间
    router.get('/:id',function *(next)
    {
        console.log("/:id1");

        let data = yield model.getRoom(this.params.id);
        this.body = JSON.stringify(data);
        console.log("/:id");
        return yield next
    });

    // 提交订单
    router.post('/submit',function *(next)
    {
        this.body = this.params + " Page";
        return yield next
    });

    // 查看房间当前情况
    router.get('/:id/fuck',function *(next)
    {
        this.body = this.params.id + " fuck Page";
        return yield next
    });

};
