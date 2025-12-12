# Kiro CLI pre block. Keep at the top of this file.
[[ -f "${HOME}/Library/Application Support/kiro-cli/shell/bashrc.pre.bash" ]] && builtin source "${HOME}/Library/Application Support/kiro-cli/shell/bashrc.pre.bash"
eval "$(starship init bash)"

if [ ${TERM_PROGRAM:-''} = 'WarpTerminal' ]; then
  printf '\eP$f{"hook": "SourcedRcFileForWarp", "value": { "shell": "zsh" }}\x9c'
  source ~/.config/aliases

  PROMPT=${PROMPT}$'\n\n'
else
  source $(gcloud info --format='value(installation.sdk_root)')/*.zsh.inc
  source ~/.config/zsh/plugins/syntax-highlighting/zsh-syntax-highlighting.zsh
  source ~/.config/zsh/plugins/autosuggestions/zsh-autosuggestions.zsh
  source ~/.config/zsh/plugins/tab-title/zsh-tab-title.plugin.zsh
  source ~/.config/zsh/ohmy/plugins/dirhistory/dirhistory.plugin.zsh
  source ~/.config/zsh/ohmy/plugins/sudo/sudo.plugin.zsh
  source ~/.config/zsh/plugins/abbr/zsh-abbr.zsh

  PROMPT=${PROMPT}$'\n'
fi

# Kiro CLI post block. Keep at the bottom of this file.
[[ -f "${HOME}/Library/Application Support/kiro-cli/shell/bashrc.post.bash" ]] && builtin source "${HOME}/Library/Application Support/kiro-cli/shell/bashrc.post.bash"
