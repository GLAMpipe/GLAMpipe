# metapipe
2*node-based (meta)data processing tool

# what is this?
http://artturimatias.github.io/metapipe/

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

    git clone https://github.com/artturimatias/metapipe.git

Then move to directory that was created:

    cd metapipe

Finally, you need to install all the extra stuff that Metapipe needs. It's easy, just type:

    npm install

One step is still needed. You need to download Metapipe nodes. You can have a zip from here:

[https://github.com/artturimatias/metapipe-nodes/archive/master.zip](https://github.com/artturimatias/metapipe-nodes/archive/master.zip)

Extract that some where and copy "nodes" directory to "metapipe" directory. Then type:

    nodeje metapipe.js

You should see something like this:

    metapipe running!
    copy this to your web browser -> http://localhost:3000

Open link in your browser and you are using Metapipe (that is, if everything went well)!
