#! /bin/sh

APPDIR=/opt/lightpv-server
cd $APPDIR/src

echo "Pulling..."
git pull

echo "Building..."
meteor build $APPDIR --directory

echo "Installing modules..."
cd $APPDIR/bundle/programs/server
npm install

echo `date +%s` >$APPDIR/builddate

