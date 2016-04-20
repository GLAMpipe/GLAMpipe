# GLAMpipe
Visual tool for viewing, editing, downloading and uploading of GLAM-based data. 

# what is this?
http://artturimatias.github.io/GLAMpipe/

# what and where are nodes?
https://github.com/artturimatias/metapipe-nodes

# status
toddler


## install on Linux (Debian-based distros)

These commands should give you all you need to install Metapipe:

    apt-get install mongodb
    apt-get install git
    apt-get install nodejs
    apt-get install npm




Now its time to install metapipe. Start by fetching code:

    git clone https://github.com/artturimatias/GLAMpipe.git

Then move to directory that was created:

    cd GLAMpipe

Finally, you need to install all the extra stuff that Metapipe needs. It's easy, just type:

    npm install

One step is still needed. You need to download GLAMpipe nodes. You can have a zip from here:

[https://github.com/artturimatias/metapipe-nodes/archive/master.zip](https://github.com/artturimatias/metapipe-nodes/archive/master.zip)

Extract that some where and copy "nodes" directory to "GLAMpipe" directory. Then type:

    nodejs glampipe.js

You should see something like this:

    GLAMpipe running!
    copy this to your web browser -> http://localhost:3000

Open link in your browser and you are using GLAMpipe (that is, if everything went well)!
