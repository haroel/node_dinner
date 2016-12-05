/**
 * Created by howe on 2016/11/30.
 */
const fs = require("fs");
const path = require("path");


const TEMPLATE_KEYS = new Set([
    "{_base.html}",
    "{_footer.html}"
    ]);

let htmlContenHash = new Map();

let files = fs.readdirSync( path.join(__dirname,"views") );
// 过滤出.html文件:
var html_files = files.filter((f)=>{
    return f.endsWith('.html');
});
for (var f of html_files)
{
    htmlContenHash.set(f, fs.readFileSync( path.join(__dirname,"views",f) ,"utf8") )
}

let initWithHtml = ()=>
{
    for ( let [fileName, fileContent] of htmlContenHash)
    {
        if (TEMPLATE_KEYS.has( `{${fileName}}`))
        {
             continue;
        }
        for (let key of TEMPLATE_KEYS)
        {
            if (fileContent.indexOf(key) >= 0)
            {
                // {as.d}
                let tempName = key.substring(1,key.length - 1);
                fileContent = fileContent.replace( key , htmlContenHash.get( tempName ) )
            }
        }
        htmlContenHash.set(fileName ,fileContent )
    }
};

initWithHtml();
console.log("process html templates :",htmlContenHash.keys());

let getTemplateView = (htmlFileName)=>
{
    let content = htmlContenHash.get(htmlFileName);
    if (content)
    {
        return content;
    }
    return htmlContenHash.get("404.html");
};

module.exports = getTemplateView;