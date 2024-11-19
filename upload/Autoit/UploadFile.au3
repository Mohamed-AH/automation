#include <MsgBoxConstants.au3>

; Get command line parameters
$filePath = $CmdLine[1]

; Identify the window more precisely (adjust as needed)
WinWaitActive("Choose File to Upload")

; Send the file path to the edit box
ControlSetText("Choose File to Upload", "", "Edit1", $filePath)

; Click the "Open" button using the specific class name
ControlClick("Choose File to Upload", "", "Button1")

; Optional: Display a message to confirm the file was uploaded
MsgBox($MB_OK, "File Uploaded", "File uploaded successfully: " & $filePath)