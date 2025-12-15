source ~/.config/autoenv/activate.sh
eval "$(starship init bash)"
source ~/.config/aliases
PROMPT_COMMAND='prompt'
prompt() {
  PS1+='\n'

  if [ $WARP_HONOR_PS1 ]; then
    PS1+='\n'
  fi
}
