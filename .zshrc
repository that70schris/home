# Q pre block. Keep at the top of this file.
[[ -f "${HOME}/Library/Application Support/amazon-q/shell/zshrc.pre.zsh" ]] && builtin source "${HOME}/Library/Application Support/amazon-q/shell/zshrc.pre.zsh"
eval $(/opt/homebrew/bin/brew shellenv)
eval "$(starship init zsh)"

export PATH="$PATH:/opt/homebrew/Caskroom/google-cloud-sdk/latest/google-cloud-sdk/bin"
export HOMEBREW_BUNDLE_FILE=~/Brewfile
export HOMEBREW_NO_ENV_HINTS=true
export CLICOLOR=1
alias kubectl='kubecolor'
setopt autocd

NEWLINE=$'\n'
PROMPT="$PROMPT$NEWLINE"
if [ ${TERM_PROGRAM:-''} = 'WarpTerminal' ]; then
  printf '\eP$f{"hook": "SourcedRcFileForWarp", "value": { "shell": "zsh" }}\x9c'
  source ~/.config/aliases
else
  source $(gcloud info --format='value(installation.sdk_root)')/*.zsh.inc
  source ~/.config/zsh/plugins/syntax-highlighting/zsh-syntax-highlighting.zsh
  source ~/.config/zsh/plugins/autosuggestions/zsh-autosuggestions.zsh
  source ~/.config/zsh/plugins/tab-title/zsh-tab-title.plugin.zsh
  source ~/.config/zsh/ohmy/plugins/dirhistory/dirhistory.plugin.zsh
  source ~/.config/zsh/ohmy/plugins/sudo/sudo.plugin.zsh
  source ~/.config/zsh/plugins/abbr/zsh-abbr.zsh

  PROMPT="$PROMPT❯ "
fi

# Q post block. Keep at the bottom of this file.
[[ -f "${HOME}/Library/Application Support/amazon-q/shell/zshrc.post.zsh" ]] && builtin source "${HOME}/Library/Application Support/amazon-q/shell/zshrc.post.zsh"
