echo ==== Load nvm ====
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" # This loads nvm

echo ==== Test using node 4.x ====
nvm install 4.8.4
rm -rf node_modules
npm install
npm test

echo ==== Test using node 6.x ====
nvm install 6.11.4
rm -rf node_modules
npm install
npm test
curl -sSL https://download.sourceclear.com/ci.sh | bash

echo ==== Test using node 8.x ====
nvm install 8.7.0
rm -rf node_modules
npm install --no-shrinkwrap
npm test
