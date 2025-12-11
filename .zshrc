source /opt/homebrew/opt/autoenv/activate.sh
eval "$(starship init zsh)"
setopt autocd

NEWLINE=$'\n'
PROMPT="${PROMPT}${NEWLINE}"
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

  PROMPT="${PROMPT}❯ "
fi
