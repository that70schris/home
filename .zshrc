source ~/.config/autoenv/activate.sh
eval "$(starship init zsh)"
source ~/.config/aliases
setopt autocd

# doesn't work in Warp terminal
# source $(gcloud info --format='value(installation.sdk_root)')/*.zsh.inc
source ~/.config/zsh/plugins/syntax-highlighting/zsh-syntax-highlighting.zsh
source ~/.config/zsh/plugins/autosuggestions/zsh-autosuggestions.zsh
source ~/.config/zsh/plugins/tab-title/zsh-tab-title.plugin.zsh
source ~/.config/zsh/ohmy/plugins/dirhistory/dirhistory.plugin.zsh
source ~/.config/zsh/ohmy/plugins/sudo/sudo.plugin.zsh
source ~/.config/zsh/plugins/abbr/zsh-abbr.zsh
abbr import-aliases --quiet

PS1+=$'\n'
if [ $WARP_HONOR_PS1 ]; then
  PS1+=$'\n'
fi
