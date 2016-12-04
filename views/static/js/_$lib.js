/**
 * Created by howe on 2016/11/29.
 */

function warnDialog(str)
{
    zeroModal.alert({
        content: str,
        transition:true,
        ok:false,
        width: '400px',
        height: '250px'
    });
}
function errorDialog(str)
{
    zeroModal.error({
        content: str,
        transition:true,
        ok:false,
        width: '400px',
        height: '250px'
    });
}
function infoDialog(str)
{
    zeroModal.alert({
        content: str,
        transition:true,
        ok:false,
        width: '400px',
        height: '250px'
    });
}
function successDialog(str)
{
    zeroModal.success({
        content: str,
        transition:true,
        ok:false,
        width: '400px',
        height: '250px'
    });
}
function showLoading()
{
    zeroModal.loading(6);
}

function removeLoading()
{
    zeroModal.closeAll();
}

function _viewHelperInit()
{
    $(function () { $("[data-toggle='tooltip']").tooltip(); });

    var left_menu = document.getElementById( 'left-menu' );
    var footer = document.getElementById( 'foot' );
    if (left_menu)
    {
        $.get("_menu.html",function(data){
            $(left_menu).html(data);
            // menu初始化后回调函数
            if (window.menuInitedCallback)
            {
                window.menuInitedCallback();
            }
        });
    }
    if (footer) {
        $.get("_footer.html", function (data) {
            $(footer).html(data);
            if (window.footerInitedCallback)
            {
                window.footerInitedCallback();
            }
        });
    }
}
_viewHelperInit();