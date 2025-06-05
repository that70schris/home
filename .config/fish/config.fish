/opt/homebrew/bin/brew shellenv | source
starship init fish | source
functions -c fish_prompt starship
function fish_prompt
  starship
  if test $TERM_PROGRAM = 'WarpTerminal'
    echo ''
  else
    echo '\n❯ '
  end
end

if test $TERM_PROGRAM = 'WarpTerminal'
  printf '\eP$f{"hook": "SourcedRcFileForWarp", "value": { "shell": "fish" }}\x9c'
  source ~/.config/aliases
else

  alias kubectl=kubecolor
  abbr abort git rebase --abort
  abbr add git add
  abbr amend git commit --amend
  abbr ammend git commit -a --amend --no-edit
  abbr c gcloud
  abbr check git checkout
  abbr clean git clean -fdx
  abbr cloud gcloud
  abbr commit git commit -am
  abbr d docker
  abbr dc docker compose
  abbr diff git difftool
  abbr fetch git fetch --prune
  abbr fire firebase
  abbr g git
  abbr gs git status --short
  abbr k kubectl
  abbr kube kubectl
  abbr list git branch
  abbr ls ls -a
  abbr merge git merge
  abbr npg npm i -g npm-check-updates
  abbr npi 'ncu -u; npm i'
  abbr npu ncu -u
  abbr npv ncu
  abbr pick git cherry-pick
  abbr pull git pull
  abbr push git push
  abbr rebase git rebase
  abbr reset git reset
  abbr roots 'git log --pretty=format:"%h %an %ar: %s" --graph'
  abbr show git showtool
  abbr skip git rebase --skip
  abbr stash git stash
  abbr tool git mergetool
  abbr trim git branch -D

end
