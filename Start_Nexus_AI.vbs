Set WshShell = CreateObject("WScript.Shell")
' Run the npm dev server hidden (0 means hide window)
WshShell.Run "cmd.exe /c npm run dev", 0, False
' Wait a couple of seconds for the server to start, then open the browser
WScript.Sleep 3000
WshShell.Run "http://localhost:5173"
