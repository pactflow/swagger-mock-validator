echo ==== Load nvm ====
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" # This loads nvm

echo ==== Test using node 4.x ====
nvm install 4.8.0
rm -rf node_modules
npm install
npm test

echo ==== Test using node 6.x ====
nvm install 6.10.0
rm -rf node_modules
npm install
npm test

echo ==== Test using node 7.x ====
nvm install 7.7.1
rm -rf node_modules
npm install
npm test
