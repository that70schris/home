source ~/.config/autoenv/activate.sh
source ~/.config/aliases

eval "$(starship init bash)"
PROMPT_COMMAND='prompt'
prompt() {
  PS1+='\n'
  if [ $WARP_HONOR_PS1 ]; then
    PS1+='\n'
  fi
}
