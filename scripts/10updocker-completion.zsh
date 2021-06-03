###-begin-10updocker-completions-###
#
# yargs command completion script
#
# Installation: 10updocker completion zsh >> ~/.zshrc
#
_10updocker_yargs_completions()
{
  local reply
  local si=$IFS
  IFS=$'
' reply=($(COMP_CWORD="$((CURRENT-1))" COMP_LINE="$BUFFER" COMP_POINT="$CURSOR" 10updocker --get-yargs-completions "${words[@]}"))
  IFS=$si
  _describe 'values' reply
}
compdef _10updocker_yargs_completions 10updocker
###-end-10updocker-completions-###

###-begin-10updocker-hosts-completions-###
#
# yargs command completion script
#
# Installation: 10updocker-hosts completion >> ~/.zshrc
#
_10updocker-hosts_yargs_completions()
{
  local reply
  local si=$IFS
  IFS=$'
' reply=($(COMP_CWORD="$((CURRENT-1))" COMP_LINE="$BUFFER" COMP_POINT="$CURSOR" 10updocker-hosts --get-yargs-completions "${words[@]}"))
  IFS=$si
  _describe 'values' reply
}
compdef _10updocker-hosts_yargs_completions 10updocker-hosts
###-end-10updocker-hosts-completions-###
