/**
 * Created by howe on 2016/11/30.
 */
const path = require('path');
const mime = require('mime');
var fsPromise = require("./fsPromise.js");

// url: 类似 '/static/'
// dir: 类似 __dirname + '/static'
function staticFiles( pattern, dir)
{
    let handler = function *( next)
    {
        let rpath = this.path;
        let p = rpath.indexOf(pattern);
        if(p>=0)
        {
            let fp = path.join(dir, rpath.substring(p + pattern.length));
            let exist = yield fsPromise.exists(fp);
            if (exist)
            {
                this.type = mime.lookup(rpath);
                this.body = yield fsPromise.readFile(fp);
            }else
            {
                this.status = 404;
            }
        }else
        {
            yield next;
        }
    };
    return handler;
}

module.exports = staticFiles;