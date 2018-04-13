#!/bin/sh
DIR="/glampipe-data"
DATA_DIR=$PWD$DIR
MONGO_VERSION=3.6
DOCKERHUB="glampipe/glampipe:latest"

echo "**************** GLAMpipe installation *******************"
echo "* This will install GLAMpipe in Docker environment."
echo "* Installation downloads several hundreds of megabytes..."
echo "* directory: " $DATA_DIR
echo "**********************************************************"

echo "Creating custom network for connecting Mongo and GLAMpipe..."

if ! docker network ls|grep -q 'glampipe_net'
	then docker network create --driver bridge glampipe_net
	else echo "'glampipe_net' network exists, good..."
fi


echo "Creating data volume..."

if docker volume ls|grep -wq 'glampipe-data'
	then
		echo "Data volume exists, good..."
	else
		echo "Creating data volume..."
		docker volume create glampipe-data
fi

echo "Setting up Mongo database..."

if docker ps|grep -wq 'glampipe_mongo'
	then
		echo "Mongo container running, good..."
	else
		if docker ps -a|grep -wq 'glampipe_mongo'
			then
				echo "Mongo container exists but not running, starting it..."
				docker start glampipe_mongo
			else 
				echo "Mongo container not found..."
				echo  "Downloading and starting Mongo..."
				docker run -d --network=glampipe_net --name=glampipe_mongo mongo:$MONGO_VERSION
		fi		
fi

echo "Checking new version of GLAMpipe..."
docker pull $DOCKERHUB


if docker ps|grep -wq 'glampipe'
	then
		echo "GLAMpipe is running... I'll re-create the container"
		docker stop glampipe
		docker rm glampipe
		docker run -d --network=glampipe_net --name glampipe -v glampipe-data:/glampipe-data -p 3000:3000 -e DOCKER=1 $DOCKERHUB bash -c 'node glampipe'
		docker logs -f glampipe
	else
		docker rm glampipe
		docker run -d --network=glampipe_net --name glampipe -v glampipe-data:/glampipe-data -p 3000:3000 -e DOCKER=1 $DOCKERHUB bash -c 'node glampipe'
		docker logs -f glampipe
fi
