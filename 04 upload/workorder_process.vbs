Option Explicit

' Create shell and fso objects
Dim shell, fso, IE
Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Configuration using environment variables
Const ENV_PREFIX = "WORKORDER_"
Function GetEnvVar(varName)
    Dim value
    value = shell.ExpandEnvironmentStrings("%" & ENV_PREFIX & varName & "%")
    ' Check if environment variable exists
    If value = "%" & ENV_PREFIX & varName & "%" Then
        WScript.Echo "Error: Environment variable " & ENV_PREFIX & varName & " not found"
        WScript.Quit(1)
    End If
    GetEnvVar = value
End Function

' Get configuration from environment variables
Dim PDF_PATH, TARGET_URL, UPLOAD_EXE_PATH
PDF_PATH = GetEnvVar("PDF_PATH")         
TARGET_URL = GetEnvVar("TARGET_URL")     
UPLOAD_EXE_PATH = GetEnvVar("UPLOAD_EXE_PATH") 

Const MAX_RETRIES = 3 ' Maximum number of retries

Function GetIEWindow()
    Dim shellWindows, window
    Set shellWindows = CreateObject("Shell.Application").Windows
    For Each window In shellWindows
        On Error Resume Next
        If InStr(window.LocationURL, TARGET_URL) > 0 Then
            Set GetIEWindow = window
            WScript.Echo "Found JDE window at: " & window.LocationURL
            Exit Function
        End If
        On Error GoTo 0
    Next
End Function

Function SelectLocalRadio(frame)
    On Error Resume Next
    Dim retries, localRadio, isSelected
    retries = 0
    isSelected = False
    Do While retries < MAX_RETRIES And Not isSelected
        ' Find radio button
        Set localRadio = frame.contentDocument.querySelector("input[type='radio'][value='local']")
        If Not localRadio Is Nothing Then
            WScript.Echo "Found local radio button (attempt " & (retries + 1) & ")"
            ' Click the radio button
            localRadio.Click
            WScript.Echo "Clicked local radio button"
            WScript.Sleep 1000
            ' Click again to ensure
            localRadio.Click
            WScript.Sleep 1000
            ' Execute the POST action
            frame.contentDocument.parentWindow.execScript "MOImageCmd('POST')", "JavaScript"
            WScript.Sleep 2000
            ' Verify if it's selected
            If localRadio.checked Then
                WScript.Echo "Local radio button is selected"
                isSelected = True
                Exit Do
            Else
                WScript.Echo "Local radio button is not selected, retrying..."
            End If
        End If
        retries = retries + 1
        WScript.Sleep 1000
    Loop
    SelectLocalRadio = isSelected
End Function

Function WaitForFileDialog()
    Dim shell, windows, window
    Set shell = CreateObject("Shell.Application")
    Dim dialogFound, i
    dialogFound = False
    
    ' Wait for dialog to appear (try for a few seconds)
    For i = 1 To 10
        Set windows = shell.Windows
        For Each window In windows
            ' Check for file dialog window
            If InStr(window.LocationName, "File Upload") > 0 Or _
               InStr(window.LocationName, "Choose File") > 0 Or _
               InStr(LCase(window.LocationName), "open") > 0 Then
                WScript.Echo "Found file dialog: " & window.LocationName
                Set WaitForFileDialog = window
                dialogFound = True
                Exit For
            End If
        Next
        
        If dialogFound Then Exit For
        WScript.Sleep 500
    Next
End Function

Sub SelectLocalFile(frame, workOrderNumber)
    On Error Resume Next
    
    ' Find the FileUpload form
    Dim uploadForm
    Set uploadForm = frame.contentDocument.forms("FileUpload")
    If Not uploadForm Is Nothing Then
        WScript.Echo "Found FileUpload form"
        
        ' Find the file input within the form
        Dim fileInput
        Set fileInput = uploadForm.elements("urlName")
        If Not fileInput Is Nothing Then
            WScript.Echo "Found file input element"
            
            ' Full path to file
            Dim filePath
            filePath = PDF_PATH & workOrderNumber & ".pdf"
            
            ' Invoke the AutoIt executable
            WScript.Echo "Invoking UploadFile.exe with file: " & filePath
            shell.Run """" & UPLOAD_EXE_PATH & """ """ & filePath & """", 1, False
            
            ' Focus and click to open dialog
            fileInput.Focus
            WScript.Sleep 1000
            fileInput.Click
            WScript.Sleep 2000
            
            ' Wait for the file dialog to appear
            Dim fileDialog
            Set fileDialog = WaitForFileDialog()
            
            If Not fileDialog Is Nothing Then
                WScript.Echo "File dialog found, AutoIt script should handle file selection"
                WScript.Sleep 3000 ' Wait for AutoIt script to complete
            Else
                WScript.Echo "File dialog not found after waiting"
            End If
        Else
            WScript.Echo "File input element not found"
        End If
    Else
        WScript.Echo "FileUpload form not found"
    End If
    
    If Err.Number <> 0 Then
        WScript.Echo "Error in SelectLocalFile: " & Err.Description
        Err.Clear
    End If
End Sub

Function ClickSaveButton(frame)
    On Error Resume Next
    WScript.Echo "Looking for Save button..."
    ' Try multiple methods to find the Save button
    Dim saveButton
    ' Method 1: Try by name
    Set saveButton = frame.contentDocument.getElementsByName("BUTTONSAVEEXIT")(0)
    If Not saveButton Is Nothing Then
        WScript.Echo "Found Save button by name"
        saveButton.Click
        WScript.Echo "Clicked Save button"
        WScript.Sleep 2000
        Exit Function
    End If
    
    ' Method 2: Try by href content
    Dim links, link
    Set links = frame.contentDocument.getElementsByTagName("a")
    For Each link In links
        If InStr(link.href, "MOCmd('SAVEEXIT')") > 0 Then
            WScript.Echo "Found Save button by href"
            link.Click
            WScript.Echo "Clicked Save button"
            WScript.Sleep 2000
            Exit Function
        End If
    Next
    
    ' Method 3: Try executing the JavaScript directly
    WScript.Echo "Trying JavaScript method..."
    frame.contentDocument.parentWindow.execScript "MOCmd('SAVEEXIT')", "JavaScript"
    WScript.Sleep 2000
    
    If Err.Number <> 0 Then
        WScript.Echo "Error clicking Save button: " & Err.Description
        Err.Clear
    End If
End Function

Sub HandleWorkOrder(workOrderNumber)
    On Error Resume Next
    
    ' Switch to iframe
    WScript.Echo "Switching to iframe..."
    Dim frame
    Set frame = IE.Document.getElementById("e1menuAppIframe")
    
    If Not frame Is Nothing Then
        IE.Document.parentWindow.frames("e1menuAppIframe").focus()
        WScript.Sleep 1500
        
        ' Enter work order number
        Dim woInput
        Set woInput = frame.contentDocument.getElementsByName("qbe0_1.0")(0)
        
        If Not woInput Is Nothing Then
             woInput.Focus
             woInput.Value = ""
            WScript.Sleep 1000
            
            ' Send the work order number followed by Enter key
            shell.SendKeys  "*" & workOrderNumber & "*{ENTER}" 
            WScript.Sleep 500
            shell.SendKeys "{ENTER}"
            WScript.Echo "Sent work order: *" & workOrderNumber & "* and Enter key"
            
            WScript.Sleep 3000
            
            ' Continue with attachment icon
            Dim attIcon
            Set attIcon = frame.contentDocument.getElementsByName("rim0_1.0")(0)
            If Not attIcon Is Nothing Then
                attIcon.Click
                WScript.Echo "Clicked attachment icon"
                WScript.Sleep 2000
                
                ' Click add image button
                Dim addButton
                Set addButton = frame.contentDocument.getElementsByName("BUTTONADDIMAGE")(0)
                If Not addButton Is Nothing Then
                    addButton.Click
                    WScript.Echo "Clicked add image button"
                    WScript.Sleep 3000 ' Increased wait time
                    
                    ' Try to select local radio with verification
                    If SelectLocalRadio(frame) Then
                        ' Handle file selection
                        SelectLocalFile frame, workOrderNumber
                        WScript.Sleep 2000
                        
                        ' Click Add button (hc1)
                        Dim hc1Button
                        Set hc1Button = frame.contentDocument.getElementsByName("hc1")(0)
                        If Not hc1Button Is Nothing Then
                            hc1Button.Click
                            WScript.Echo "Clicked Add button"
                            WScript.Sleep 3000 ' Increased wait for upload
                            
                            ' After upload completes, click Save
                            ClickSaveButton frame
                        End If
                    Else
                        WScript.Echo "Failed to select local radio button after " & MAX_RETRIES & " attempts"
                    End If
                End If
            End If
        End If
    End If
End Sub

Sub ProcessWorkOrders()
    ' Verify environment variables are set
    If PDF_PATH = "" Or TARGET_URL = "" Or UPLOAD_EXE_PATH = "" Then
        WScript.Echo "Error: Required environment variables are not set"
        WScript.Quit(1)
    End If
    
    ' Verify paths exist
    If Not fso.FolderExists(PDF_PATH) Then
        WScript.Echo "Error: PDF folder path does not exist: " & PDF_PATH
        WScript.Quit(1)
    End If
    
    If Not fso.FileExists(UPLOAD_EXE_PATH) Then
        WScript.Echo "Error: Upload executable not found: " & UPLOAD_EXE_PATH
        WScript.Quit(1)
    End If
    
    ' Get existing IE window
    Set IE = GetIEWindow()
    If IE Is Nothing Then
        WScript.Echo "Cannot find JDE window"
        Exit Sub
    End If
    
    ' Process work orders
    Dim workOrders, wo
    workOrders = Array("614507","614508","614509","614510","614511","614512","614513","614514","614515","614516","614517","614518","614519","614520","614521","614522","614523","614524","614525","614526","614527","614528","614529","614530","614531","614532","614533","614534","614535","614536","614537","614538","614539","614540","614541","614542","614543","614544","614545","614546","614547","614548","614549","614550","614551","614552","614553","614554","614555","614556","614557","614558","614559","614560","614561","614562","614563","614564","614565","614566","614567","614568","614569","614570","614571","614572","614573","614574","614575","614576","614577","614578","614579","614580","614581","614582","614583","614584","614585","614586","614587","614588","614589","614590","614591","614592","614593","614594","614595","614596","614597","614598","614599","614600","614601","614602","614603","614604","614605","614606","614607","614608","614609","614610","614611","614612","614613","614614","614615","614616","614617","614618","614619","614620","614621","614622","614623","614624","614625","614626","614627","614628","614629","614630","614631","614632","614633","614634","614635","614636","614637","614638","614639","614640","614641","614642","614643","614644","614645","614646","614653","614647","614648","614649","614650","614651","614652","614654","614655","614656","614657","614658","614659","614660","614661","614662","614663","614664","614665","614666","614667","614668","614669","614670","614671","614672","614673","614674","614675","614676","614677","614678","614679","614680","614681","614682","614683","614684","614685","614686","614687","614688","614689","614690","614691","614692","614693","614694","614695","614696","614697","614698")
    
    For Each wo In workOrders
        If fso.FileExists(PDF_PATH & wo & ".pdf") Then
            WScript.Echo "Processing work order: " & wo
            HandleWorkOrder wo
            WScript.Sleep 2000
        Else
            WScript.Echo "PDF not found for work order: " & wo
            WScript.Echo "Expected path: " & PDF_PATH & wo & ".pdf"
        End If
    Next
End Sub

' Start processing
WScript.Echo "Starting work order processing..."
ProcessWorkOrders
WScript.Echo "Script completed"

Set IE = Nothing
Set shell = Nothing
Set fso = Nothing