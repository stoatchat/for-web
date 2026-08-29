#!/usr/bin/env bash
# Build local puis envoi vers l'instance de deploiement.
# L'instance (2 vCPU / 3 Go) est trop petite pour builder sur place -> on build ici.
#
# La cible vit dans .env (gitignore) : copier .env.example et remplir.
set -euo pipefail

# le script manipule des chemins du repo, on se place a sa racine
cd "$(dirname "$0")"

if [ -f .env ]; then
  . ./.env
fi

HOST=${DEPLOY_HOST:?definir DEPLOY_HOST dans .env (voir .env.example)}
SSH_PORT=${DEPLOY_SSH_PORT:-22}
SSH_KEY=${DEPLOY_SSH_KEY:-$HOME/.ssh/id_ed25519}
REMOTE_PATH=${DEPLOY_PATH:-/opt/stoat-web/dist/}
SERVICE=${DEPLOY_SERVICE:-stoat-web}
SSHOPT="-i $SSH_KEY -p $SSH_PORT -o ConnectTimeout=15"

export PATH="$HOME/.local/share/mise/shims:$PATH"

# BASE_PATH doit rester "/" : on sert a la racine du sous-domaine, pas sous /app/
# comme le fait `mise build:prod` pour stoat.chat.
unset BASE_PATH PWA_SCOPE

echo "==> build local"
mise run build:deps
mise run build

echo "==> envoi vers $HOST"
rsync -a --delete -e "ssh $SSHOPT" packages/client/dist/ "$HOST:$REMOTE_PATH"

echo "==> redemarrage du service"
ssh $SSHOPT "$HOST" "sudo systemctl restart $SERVICE && sleep 2 && systemctl is-active $SERVICE"

echo "==> en ligne : ${DEPLOY_URL:-https://${HOST#*@}}"
