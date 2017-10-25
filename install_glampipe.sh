#!/bin/sh
DIR="/glampipe-data"
DATA_DIR=$PWD$DIR

echo "**************** GLAMpipe installation *******************"
echo "* This will install GLAMpipe in Docker environment."
echo "* Installation downloads several hundreds of megabytes..."
echo "* directory: " $DATA_DIR
echo "**********************************************************"

echo "Creating custon network for connecting mongo and GLAMpipe..."

if ! docker network ls|grep -q 'glampipe_net'
	then docker network create --driver bridge glampipe_net
	else echo "glampipe_net network exists, good..."
fi

echo "Setting up Mongo database..."

if docker ps|grep -wq 'mongo'
	then
		echo "Mongo container running, good..."
	else
		if docker ps -a|grep -wq 'mongo'
			then
				echo "Mongo container exists but not running, starting it..."
				docker start mongo
			else 
				echo "Mongo container not found..."
				echo  "Downloading and starting Mongo..."
				docker run -d --network=glampipe_net --name=mongo mongo
		fi		
fi

echo "Checking new version of GLAMpipe..."
docker pull artturimatias/glampipe:dev


if docker ps|grep -wq 'glampipe'
	then
		echo "GLAMpipe is running... I'll re-create the container"
		docker stop glampipe
		docker rm glampipe
		docker run -d --network=glampipe_net --name glampipe -v $DATA_DIR:/glampipe-data -p 3000:3000 -e DOCKER=1 artturimatias/glampipe:dev bash -c 'node glampipe'
		docker logs -f glampipe
	else
		docker rm glampipe
		docker run -d --network=glampipe_net --name glampipe -v $DATA_DIR:/glampipe-data -p 3000:3000 -e DOCKER=1 artturimatias/glampipe:dev bash -c 'node glampipe'
		docker logs -f glampipe
fi
