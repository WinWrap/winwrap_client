<?php
function loghit($key) {
  $log_file = getcwd() . '/../../log/visitors.log';
  if (file_exists($log_file)) {
    $line = "$key\t" . date('Y-m-d H:i:s') . "\t$_SERVER[REMOTE_ADDR]";
    file_put_contents($log_file, $line . "\r\n", FILE_APPEND);
  }
}
loghit('index');
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <title>WinWrap Client</title>
    <link rel="stylesheet" href="scripts/font-awesome/css/fontawesome-all.min.css">
    <link rel="stylesheet" href="scripts/jquery-ui.css">
    <link rel="stylesheet" href="winwrap/stock-ui/style.css">
    <script src="scripts/jquery.js"></script>
    <script src="scripts/jquery-ui.min.js"></script>
    <script src="scripts/monaco-editor/min/vs/loader.js"></script>
    <script src="scripts/crypto-api/crypto-api.min.js"></script>
    <script src="winwrap/stock-ui/index.js"></script>
    <script src="tests/test.js"></script>
    <script src="tests/test001.js"></script>
    <script>
        // https://jqueryui.com/tooltip/
        $(function () {
            $(document).tooltip();
        });
    </script>
    <style type="text/css">
        html, body {
            height: 100%;
            width: 99%;
        }
        .ww-remote-1 {
            height: 100%;
        }
        .ww-item-menu {
            height: auto;
        }
        .ww-item-immediate {
            height: 20%;
            width: 100%;
        }
        .ww-item-watch {
            height: 20%;
            width: 100%;
        }
        .ww-item-code {
            height: 85%;
            width: 100%;
        }
    </style>
</head>
<body>
    <div class="ww-remote-1">
        <div class="ww-item-menu">
        <fieldset id="ww-remote-1-menu">
            <a class="ui-button ui-widget ui-corner-all" href="https://www.winwrap.com/web2/news/web-based-editing" target="_blank">WinWrap&reg;</a>
            <button class="ww-remote-1 ww-item-new ui-button ui-widget ui-corner-all"><i class="fas fa-file"></i></button>
            <input class="ww-remote-1 ww-item-files ui-autocomplete-input ui-widget ui-corner-all" />
            <button class="ww-remote-1 ww-item-save ui-button ui-widget ui-corner-all"><i class="fas fa-save"></i></button>
            <button class="ww-remote-1 ww-item-check ui-button ui-widget ui-corner-all"><i class="fas fa-check-square"></i></button>
            <button class="ww-remote-1 ww-item-run ui-button ui-widget ui-corner-all"><i class="fas fa-play"></i></button>
            <button class="ww-remote-1 ww-item-pause ui-button ui-widget ui-corner-all"><i class="fas fa-pause"></i></button>
            <button class="ww-remote-1 ww-item-end ui-button ui-widget ui-corner-all"><i class="fas fa-stop"></i></button>
            <button class="ww-remote-1 ww-item-into ui-button ui-widget ui-corner-all"><i class="fas fa-angle-down fa-lg"></i></button>
            <button class="ww-remote-1 ww-item-over ui-button ui-widget ui-corner-all"><i class="fas fa-angle-double-down fa-lg"></i></button>
            <button class="ww-remote-1 ww-item-out ui-button ui-widget ui-corner-all"><i class="fas fa-angle-double-left fa-lg"></i></button>
            <button class="ww-remote-1 ww-item-cycle ui-button ui-widget ui-corner-all"><i class="fas fa-window-restore"></i></button>
        </fieldset>
        </div>
        <div class="ww-remote-1 ww-item-immediate" style="border:1px solid grey; display:none"></div>
        <div class="ww-remote-1 ww-item-watch" style="border:1px solid grey; display:none"></div>
        <div class="ww-remote-1 ww-item-code" style="border:1px solid grey"></div>
        <div style="font-size:smaller"><span class="ww-remote-1 ww-item-statusbar">Status Bar</span></div>
    </div>
    <pre><span id="jsondata"></span></pre>
</body>
</html>