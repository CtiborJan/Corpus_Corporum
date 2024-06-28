<html><!-- frontend index-->
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>Corpus Corporum</title>
<script type="text/javascript">
<?php 
include "php_modules/stats.incl"; 
add_visitor("","",0,true);?>
<?php include "url.incl"; ?>
var basex_url=url+"ccadmin/basex/basex_interface.php";
<?php
//$url="https://mlat.uzh.ch/";
$url="";
$app="";
if ($_REQUEST["app"]=="home" || $_REQUEST["app"]=="" && $_SERVER["REDIRECT_URL"]=="/home")
        $app="home";
else if ($_REQUEST["app"]=="browser" || $_SERVER["REDIRECT_URL"]=="/browser")
        $app="browser";
else if ($_REQUEST["app"]=="dictionaries" || $_SERVER["REDIRECT_URL"]=="/dictionaries")
        $app="dictionaries";
else if ($_REQUEST["app"]=="bible" || $_SERVER["REDIRECT_URL"]=="/bible")
        $app="bible";
?>
var taskbar_btn_color="rgb(231, 207, 188)";
function onLoad()
{
    B=new cls_base();
    B.url_resolver=new cls_url_resolver(window.location,B);
 
    window.dispatchEvent(new Event('resize'));
    
}
</script>
<script src="<?php echo $url ?>base.js"></script>
<script src="<?php echo $url ?>cc_modules/submodules/object_viewer.js"></script>
<script src="<?php echo $url ?>cc_modules/submodules/content_viewer.js"></script>
<script src="<?php echo $url ?>cc_modules/submodules/fulltext_searcher.js"></script>
<script src="<?php echo $url ?>cc_modules/submodules/simple_db_searcher.js"></script>
<script src="<?php echo $url ?>cc_modules/submodules/dictionary_lookup.js"></script>
<script src="<?php echo $url ?>cc_modules/submodules/biblical_synopsis.js"></script>
<script src="<?php echo $url ?>cc_modules/submodules/quotation_finder.js?v=060624"></script>
<script src="<?php echo $url ?>cc_modules/home.js"></script>
<script src="<?php echo $url ?>cc_modules/browser.js"></script>
<?php
if ($app=="bible")
    echo '<script src="'.$url.'cc_modules/text_viewer_new_synopsis.js"></script>\n';
else if ($_REQUEST["text_viewer"]=="new")
    echo '<script src="'.$url.'cc_modules/text_viewer_new.js"></script>\n';
else    
    echo '<script src="'.$url.'cc_modules/text_viewer.js?x=1"></script>\n';
?>
<script src="<?php echo $url ?>cc_modules/image_viewer.js"></script>
<script src="<?php echo $url ?>cc_modules/list_control.js"></script>
<script src="<?php echo $url ?>cc_modules/sorttable.js"></script>
<script src="<?php echo $url ?>cc_modules/db_search.js"></script>
<script src="<?php echo $url ?>cc_modules/url_resolver.js"></script>
<script src="<?php echo $url ?>cc_modules/dictionaries.js"></script>
<link rel="stylesheet" href="<?php echo $url ?>cc_modules/colors.css">
<link rel="stylesheet" href="<?php echo $url ?>cc_modules/list_control.css">
<link rel="stylesheet" href="<?php echo $url ?>cc_modules/main.css">
<link rel="stylesheet" href="<?php echo $url ?>cc_modules/primitives.css">
<link rel="stylesheet" href="<?php echo $url ?>cc_modules/text_styles.css">
<link rel="stylesheet" href="<?php echo $url ?>cc_modules/dictionaries.css">
</head>
<body onload="onLoad()">
<div style="height:0px;width:99%;position:absolute;z-index:2;top:0px;">
<!--<div style="width:100%;height:200px">

</div>-->
<!--<div style="width:100%;height:100px">
    <div style="width:100px;height:100px;background:url(cc_modules/img1.jpg);background-size:cover"></div>
</div>-->

<div style="width:100%;height:35px;top:0px;">
    <a href="home"><div class="top_bar_button <?php if ($app=='home' || $app=='') echo 'active';?>">HOME</div></a>
    <a href="browser"><div class="top_bar_button <?php if ($app=='browser') echo 'active';?>">BROWSER</div></a>
    <a href="dictionaries"><div class="top_bar_button <?php if ($app=='dictionaries') echo 'active';?>">DICTIONARIES</div></a>
    <a href="bible"><div class="top_bar_button <?php if ($app=='bible') echo 'active';?>">SYNOPTIC BIBLE</div></a>
    <a href="help.html" target="_blank"><div class="top_bar_button">HELP</div></a>
</div>

</div>
<div style="height:100%;width:99%;top:0px;position:absolute;">
<div  id="base" style="position:absolute;top:35px;width:100%;bottom:0px;overflow:hidden"></div>
</div>
</body>
</html>
