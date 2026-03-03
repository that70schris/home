source ~/.config/zsh/plugins/syntax-highlighting/zsh-syntax-highlighting.zsh
source ~/.config/zsh/plugins/autosuggestions/zsh-autosuggestions.zsh
source ~/.config/zsh/plugins/tab-title/zsh-tab-title.plugin.zsh
source ~/.config/zsh/ohmy/plugins/dirhistory/dirhistory.plugin.zsh
source ~/.config/zsh/ohmy/plugins/sudo/sudo.plugin.zsh
source ~/.config/zsh/plugins/abbr/zsh-abbr.zsh
source ~/.config/autoenv/activate.sh
source ~/.config/aliases

rm $ABBR_USER_ABBREVIATIONS_FILE
abbr import-aliases --quieter
setopt autocd

eval "$(starship init zsh)"
PS1+=$'\n'
if [ $WARP_HONOR_PS1 ]; then
  PS1+=$'\n'
fi

if CLOUDSDK=$(gcloud info --format='value(installation.sdk_root)'); then
  source ${CLOUDSDK}/*.zsh.inc
fi
