# GLAMpipe
Visual tool for viewing, editing, downloading and uploading of GLAM-based data. 


# what is this?
http://artturimatias.github.io/GLAMpipe/

# what and where are nodes?
https://github.com/artturimatias/metapipe-nodes

# status
toddler


## installation (work in progress)

GLAMpipe can be run on Linux as a nodejs application or it can be run via Docker (also on Mac, Windows not tested).

### Linux (Debian-based distros)

If you have a Linux box or you can run Linux in virtual machine, then these instructions should get you going with GLAMpipe.

1. First install mongo database and git

         apt-get install mongodb git
         
    Test that Mongo is really running. Just type:
    
        mongo
    You should see something like this:
    
        MongoDB shell version: 2.4.10
        connecting to: test
        > 

     Press CTRL + C to exit MongoDB Shell.


2. Then install nodejs. Nodejs in Debian repository is quite old so it is better to install from nodesource: https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions

    execute as root:

        curl -sL https://deb.nodesource.com/setup_6.x | bash -
        apt-get install -y nodejs


3. Create a installation directory for GLAMpipe and cd to it (as normal user)

        cd directory_you_just_created

4. Fetch GLAMpipe code from GitHub

        git clone https://github.com/artturimatias/GLAMpipe.git
        cd GLAMpipe

5. Create data directory for GLAMpipe and set it as dataPath in config/config.js.

    for example:

        mkdir /home/YOUR_USERNAME_HERE/GLAMpipe_DATA 
    sdf

        // DATAPATH
        // - where GLAMpipe can strore project data
        // default: ""
        var dataPath = "/home/__YOUR_USERNAME_HERE__/GLAMpipe_DATA ;

6. Install node dependencies

        npm install

7. Try to run

        node glampipe.js

    You should see something like this:
    
        ********************* G L A M p i pe *************************
        * DATA PATH: /home/arihayri/GLAMpipe_DATA
        * NODE PATH: 
        * STATUS:    running on http://127.0.0.1:3000
        ********************* G L A M p i pe *************************
        
    You can stop GLAMpipe by pressing CTRL + C



### Docker Compose (needs more testing)

GLAMpipe can be installed via [Docker compose](https://docs.docker.com/compose/). So first you need to install Docker:
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
 

