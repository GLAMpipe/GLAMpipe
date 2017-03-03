
IMAGES := $(shell docker images -f "dangling=true" -q)
CONTAINERS := $(shell docker ps -a -q -f status=exited)
DATA_DIR := /home/arihayri/GLAMpipe-data-docker
DATA_DIR := $(shell pwd)/data
NODE_DIR := /home/arihayri/GLAMpipe-data-docker
PWD=$(shell pwd)

all: build


clean:
	docker rm -f $(CONTAINERS)
	docker rmi -f $(IMAGES)

build_mongo:
	docker run -d --name=mongo mongo

start_mongo:
	docker start mongo

stop_mongo:
	docker stop mongo      

build_glampipe:
	docker build -t artturimatias/glampipe .


start_glampipe:
	docker run -it --rm --link mongo:mongo --name glam \
		-v $(DATA_DIR):/glampipe \
		-p 3000:3000  artturimatias/glampipe bash


.PHONY: clean build_mongo start_mongo build_glampipe start_glampipe
