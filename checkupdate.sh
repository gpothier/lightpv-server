#! /bin/sh

date
set -e

APPDIR=/opt/lightpv-server

cd $APPDIR/src

REMOTE_HEAD=`git ls-remote https://github.com/gpothier/lightpv-server.git HEAD|head -n 1|awk '{print $1}'`
CURRENT_HEAD=`git log -n 1|head -n 1|awk '{print $2}'`

echo "Remote:  $REMOTE_HEAD"
echo "Current: $CURRENT_HEAD"

if [ "$REMOTE_HEAD" = "$CURRENT_HEAD" ]
then
	echo "Already at last revision"
	exit 0
else
	$APPDIR/src/rebuild.sh
fi


