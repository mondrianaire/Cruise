@echo off
set "PATH=C:\Program Files\Git\bin;C:\Program Files\nodejs;C:\Users\mondr\AppData\Roaming\npm;C:\Windows\System32;C:\Windows;C:\Windows\System32\Wbem;%PATH%"
cd /d C:\Users\mondr\Documents\Claude\Projects\Cruise
"C:\Program Files\nodejs\node.exe" "C:\Users\mondr\AppData\Roaming\npm\node_modules\firebase-tools\lib\bin\firebase.js" deploy --only functions:calendar --non-interactive --force > _deploy.txt 2>&1
echo EXITCODE %ERRORLEVEL% >> _deploy.txt
echo done > _deploy.done
