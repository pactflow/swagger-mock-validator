echo ==== Load nvm ====
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" # This loads nvm

echo ==== Test using node 4.x ====
nvm install 4.9.1
rm -rf node_modules
npm install
npm test

echo ==== Test using node 6.x ====
nvm install 6.14.3
rm -rf node_modules
npm install
npm test

echo ==== Test using node 8.x ====
nvm install 8.11.3
rm -rf node_modules
npm install --no-shrinkwrap
npm test

echo ==== Test using node 10.x ====
nvm install 10.5.0
rm -rf node_modules
npm install --no-shrinkwrap
npm test
