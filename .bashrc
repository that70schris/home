# Kiro CLI pre block. Keep at the top of this file.
[[ -f "${HOME}/Library/Application Support/kiro-cli/shell/bashrc.pre.bash" ]] && builtin source "${HOME}/Library/Application Support/kiro-cli/shell/bashrc.pre.bash"
eval "$(/opt/homebrew/bin/brew shellenv)"

# source /opt/homebrew/opt/autoenv/activate.sh
eval "$(starship init bash)"
source ~/.config/aliases
PROMPT_COMMAND='prompt'
prompt() {
  PS1+='\n'

  if [ $TERM_PROGRAM = 'WarpTerminal' ]; then
    PS1+='\n'
  fi
}

# Kiro CLI post block. Keep at the bottom of this file.
[[ -f "${HOME}/Library/Application Support/kiro-cli/shell/bashrc.post.bash" ]] && builtin source "${HOME}/Library/Application Support/kiro-cli/shell/bashrc.post.bash"
