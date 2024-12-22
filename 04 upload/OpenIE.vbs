Option Explicit

Dim IE

' Create Internet Explorer object
Set IE = CreateObject("InternetExplorer.Application")

' Make the Internet Explorer window visible
IE.Visible = True

' Optionally, navigate to a blank page
IE.Navigate "about:blank"

' Clean up
Set IE = Nothing