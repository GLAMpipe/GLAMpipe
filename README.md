# GLAMpipe
Visual tool for viewing, editing, downloading and uploading of GLAM-based data. 


# what is this?
http://artturimatias.github.io/GLAMpipe/

# what and where are nodes?
https://github.com/artturimatias/metapipe-nodes

# status
toddler


## install on Linux (Debian-based distros)

1. These commands should give you all you need to install Metapipe:

	    apt-get install mongodb
	    apt-get install git
	    apt-get install nodejs
	    apt-get install npm


2. Now its time to install GLAMpipe. Start by fetching code:

	    git clone https://github.com/artturimatias/GLAMpipe.git
Then move to directory that was created:

	    cd GLAMpipe

4. You need to install all the extra stuff that GLAMpipe needs. It's easy, just type:

	    npm install
Then type:

	    nodejs glampipe.js
You should see something like this:

	    GLAMpipe running!
	    copy this to your web browser -> http://localhost:3000

5. Finally you must make some settings. Aim your browser address to address shown. You should see page saying like this:

		ERROR: "datapath is not set!"
You need to create a directory where GLAMpipe can save content. After you have created it, type *full path* to the text box and click "set data path".
Then fetch nodes from github by clicking "fetch nodes". 
After that finishes, click "(re)load nodes to GLAMpipe". This will import nodes to database.

 If everything went well, You are all set! 
 
##problems
If things still don't work, than make sure that you have MongoDB
a) installed
b)  running 
