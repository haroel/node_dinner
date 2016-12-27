/**
 * Created by howe on 2016/12/5.
 */
let errors = {

     ERROR_REQUEST_FREQUENT:`请求过于频繁，请稍后再试！`,

     ERROR_NOT_FOUND_ROOM: `没有找到房间!`,
     ERROR_MAX_ROOM_CREATED: `房间数已达最大，暂时不能创建！`,
     ERROR_ROOM_TIME_INVALID: `房间已失效！`,

     ERROR_PARAM_ERROR: `参数错误`,

     ERROR_DATA_ERROR: `本地数据出现错误`,
     ERROR_USER_HAD_BOOK: `用户已在该房间预订过`,
     ERROR_ROOM_HAD_EXIST: `该房间已存在，不可重复创建`,
     ERROR_ROOMID_FORMAT_ERROR:`房号错误或者格式不对!`,
     ERROR_ROOMID_LINK_ERROR:`该链接无法拉取到具体订单数据，请稍后再试!`,
     ERROR_ROOMID_IP_ERROR:`每个IP最多只能订2个菜单`,

    SUCCESS_CREATE_ROOM:`房号创建成功!`

};


module.exports = errors;