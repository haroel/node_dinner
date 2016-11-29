/**
 * Created by howe on 2016/11/26.
 */

var model = require("./db/Model.js");

module.exports = function (router,app)
{
    model.init();
    // 请求主界面 /dinner
    router.get('/', function *(next)
    {
        try
        {
            let _result = yield Promise.reject("koa fuuuuuu");
            console.log(_result);
        }catch(e)
        {
            console.log(e);
        }
        this.body = "Main Page" + model.getRoomSize();
    });

    // 创建房间界面/dinner/create
    router.get('/create',function *(next)
    {
        let params = this.params;


        this.body = "create Page";


    });

    // 进入房间
    router.get('/:id',function *(next)
    {
        let data = yield model.getRoom(this.params.id);
        this.body = JSON.stringify(data);

    });

    // 提交订单
    router.post('/submit',function *(next)
    {
        this.body = this.params + " Page";
    });

    // 查看房间当前情况
    router.get('/:id/fuck',function *(next)
    {
        this.body = this.params.id + " fuck Page";
    });

};
