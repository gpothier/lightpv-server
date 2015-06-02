#! /bin/sh

CMD=$1
APPWORKDIR=/opt/lightpv-server
APPDIR=/opt/lightpv-server/app
SERVICENAME=lightpv-server
SERVICEUSER=lightpv
GITURL=https://github.com/gpothier/lightpv-server.git

SCRIPTPATH=$APPDIR/lcscript.sh

case $CMD in
	
	"update")
		# Run this once a minute as root
		# In crontab put:
		#
		# PATH=/usr/sbin:/usr/bin:/sbin:/bin
		# * * * * * /opt/lightpv/src/update.sh >/var/log/lightpvupdate.log 2>&1
		#
		# (the PATH is to provide a full environment for restarting the service,
		# see http://ubuntuforums.org/showthread.php?t=2022708)
		
		flock -n /tmp/$SERVICENAME.lock -c "$SCRIPTPATH doupdate"
	;;
	

	"doupdate")
		# Must run as root
		# Checks if new code is available on github an restarts the service if so.
		# Must be run through the update.sh wrapper.
		echo "doupdate"
		
		set -e
		su - $SERVICEUSER -c "$SCRIPTPATH checkupdate"
		$SCRIPTPATH checkrestart
	;;
	
	"checkrestart")
		# Must run as root
		echo "checkrestart"
		
		START_DATE=`cat $APPWORKDIR/startdate`
		BUILD_DATE=`cat $APPWORKDIR/builddate`
		
		set -e
		
		echo "Start: $START_DATE"
		echo "Build: $BUILD_DATE"
		
		if [ "0$BUILD_DATE" -gt "0$START_DATE" -o "0$BUILD_DATE" -eq 0 ]
		then
			echo "Restarting"
			initctl reload-configuration
			service $SERVICENAME restart
			date +%s >$APPWORKDIR/startdate
		else
			echo "Not rebuilt since last restart"
		fi
	;;
	
	"checkupdate")
		# Must run as service user
		echo "checkupdate"
		
		BUILD_DATE=`cat $APPWORKDIR/builddate`
		
		set -e
				
		cd $APPDIR
		
		REMOTE_HEAD=`git ls-remote $GITURL HEAD|head -n 1|awk '{print $1}'`
		if [ -z "$REMOTE_HEAD" ]
		then
			echo "Could not obtain remote HEAD, exiting"
			exit 1
		fi
		CURRENT_HEAD=`git log -n 1|head -n 1|awk '{print $2}'`
		
		echo "Remote:  $REMOTE_HEAD"
		echo "Current: $CURRENT_HEAD"
		
		if [ "$REMOTE_HEAD" = "$CURRENT_HEAD" -a "0$BUILD_DATE" -ne 0 ]
		then
			echo "Already at last revision"
			exit 0
		else
			$SCRIPTPATH rebuild
			echo "Rebuilt, exiting"
		fi
	;;
	
	"rebuild")
		# Must run as service user
		echo "rebuild"
		cd $APPDIR
		
		echo "Pulling..."
		git pull
		
		cd $APPDIR/src/meteor
		
		echo "Building..."
		meteor build $APPWORKDIR --directory
		
		echo "Installing modules..."
		cd $APPWORKDIR/bundle/programs/server
		npm install
		
		echo `date +%s` >$APPWORKDIR/builddate
	;;
	
	"waitformongo")
		while :
		do
			echo "Trying to connecto to MongoDB..."
			mongo local --eval 'db.startup_log.findOne()._id'
			if [ $? -eq 0 ]
			then
				break
			fi
			sleep 1
		done
		echo "MongoDB seems to have started"
	;;
esac