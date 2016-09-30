# GLAMpipe
Visual tool for viewing, editing, downloading and uploading of GLAM-based data. 


# what is this?
http://artturimatias.github.io/GLAMpipe/

# what and where are nodes?
https://github.com/artturimatias/metapipe-nodes

# status
toddler


## installation

GLAMpipe is installed via [Docker compose](https://docs.docker.com/compose/). So first you need to install Docker:
https://docs.docker.com/engine/installation/

1. Create a data directory for GLAMpipe, open terminal and change to that directory.

	    cd directory_you_just_created


2. Next download a docker compose file:


	    https://raw.githubusercontent.com/artturimatias/GLAMpipe/compose/docker-compose.yml
Copy content from here and save it as "docker-compose.yml"
Or, if you have curl installed, you can download it directly:

	    curl -O https://raw.githubusercontent.com/artturimatias/GLAMpipe/compose/docker-compose.yml

3. Then install GLAMpipe. It's easy, just type:

	    docker-compose up

This takes a while at first time since it load few hundred megabytes of data (next time the start up is almost instant). But finally you should see something like this:

	    GLAMpipe running!
	    copy this to your web browser -> http://localhost:3000

 If everything went well, You are all set! 
 You can stop GLAMpipe by pressing CTRL + C
 
##Upgrading
Just type

	docker-compose pull
and then

	docker-compose up	
 
##What did I just do?
You run docker compose file (docker-compose.yml) that setups a database container (mongodb) and GLAMpipe container and linked them together. 
