
const system = require("system");
var page = require('webpage').create();

if (system.args.length === 1) {
    phantom.exit();
}
var url = system.args[1];

page.open(url, function (s)
{
   var content = page.evaluate(function()
   {
    return document.body.innerHTML;
  });
  console.log("innerHTML",content);
  phantom.exit();
});