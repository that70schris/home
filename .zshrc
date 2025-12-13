# Kiro CLI pre block. Keep at the top of this file.
[[ -f "${HOME}/Library/Application Support/kiro-cli/shell/zshrc.pre.zsh" ]] && builtin source "${HOME}/Library/Application Support/kiro-cli/shell/zshrc.pre.zsh"
source /opt/homebrew/opt/autoenv/activate.sh
eval "$(starship init zsh)"
source ~/.config/aliases
setopt autocd

source $(gcloud info --format='value(installation.sdk_root)')/*.zsh.inc
source ~/.config/zsh/plugins/syntax-highlighting/zsh-syntax-highlighting.zsh
source ~/.config/zsh/plugins/autosuggestions/zsh-autosuggestions.zsh
source ~/.config/zsh/plugins/tab-title/zsh-tab-title.plugin.zsh
source ~/.config/zsh/ohmy/plugins/dirhistory/dirhistory.plugin.zsh
source ~/.config/zsh/ohmy/plugins/sudo/sudo.plugin.zsh
source ~/.config/zsh/plugins/abbr/zsh-abbr.zsh
PS1=${PS1}$'\n'

if [ $WARP_HONOR_PS1 ]; then
  PS1=${PS1}$'\n'
fi

# Kiro CLI post block. Keep at the bottom of this file.
[[ -f "${HOME}/Library/Application Support/kiro-cli/shell/zshrc.post.zsh" ]] && builtin source "${HOME}/Library/Application Support/kiro-cli/shell/zshrc.post.zsh"
