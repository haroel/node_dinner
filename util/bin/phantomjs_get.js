
const system = require("system");
var page = require('webpage').create();

if (system.args.length === 1) {
    phantom.exit();
}
var url = system.args[1];

page.open(url, function (s)
{
    setTimeout(function()
    {
        var content = page.evaluate(function()
        {
            return document.body.innerHTML;
        });
        console.log(content);
        phantom.exit();
    },1000);
});