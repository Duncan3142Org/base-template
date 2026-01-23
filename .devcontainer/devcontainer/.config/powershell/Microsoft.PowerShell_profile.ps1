# Bindings
# Get-PSReadLineKeyHandler -- Get active bindings
# Get-PSReadLineKeyHandler -Unbound -- Get unbound keys
# [System.Console]::ReadKey() -- Get key codes
Set-PSReadLineKeyHandler -Chord 'Ctrl+D2' -Function MenuComplete
Set-PSReadLineKeyHandler -Chord 'Ctrl+LeftArrow' -Function BackwardWord
Set-PSReadLineKeyHandler -Chord 'Ctrl+RightArrow' -Function ForwardWord
Set-PSReadLineKeyHandler -Chord 'Shift+Ctrl+LeftArrow' -Function SelectBackwardWord
Set-PSReadLineKeyHandler -Chord 'Shift+Ctrl+RightArrow' -Function SelectForwardWord
Set-PSReadLineKeyHandler -Chord 'Ctrl+UpArrow' -Function HistorySearchBackward
Set-PSReadLineKeyHandler -Chord 'Ctrl+DownArrow' -Function HistorySearchForward
Set-PSReadLineKeyHandler -Chord 'Shift+Ctrl+UpArrow' -Function ReverseSearchHistory
Set-PSReadLineKeyHandler -Chord 'Shift+Ctrl+DownArrow' -Function ForwardSearchHistory

# Mise
mise activate pwsh | Out-String | Invoke-Expression

# Oh My PoSh
oh-my-posh init pwsh | Invoke-Expression # Must come last
