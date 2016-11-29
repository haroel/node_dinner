/**
 * Created by howe on 2016/11/26.
 * 简单版本的co模块
 */
function run(generator) {
    var gen = generator();
    function next(data) {
        var ret = gen.next(data);
        if(ret.done) return Promise.resolve("done");
        return Promise.resolve(ret.value)
            .then(data => next(data))
            .catch(ex => gen.throw(ex));
    }
    try{
        return next();
    } catch(ex) {
        return Promise.reject(ex);
    }
}

function runWithGenerator(gen) {
    //var gen = generator();
    function next(data)
    {
        var ret = gen.next(data);
        if(ret.done)
        {
            return Promise.resolve(ret.value);
        }
        return Promise.resolve(ret.value)
                      .then(data => next(data))
                      .catch(ex => {
                            gen.throw(ex)
                        });
    }
    try
    {
        return next();
    } catch(ex)
    {
        return Promise.reject(ex);
    }
}

module.exports = runWithGenerator;