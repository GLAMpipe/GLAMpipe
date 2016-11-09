IMAGES := $(shell docker images -f "dangling=true" -q)
CONTAINERS := $(shell docker ps -a -q -f status=exited)
DATA_DIR := /home/arihayri/GLAMpipe-data
NODE_DIR := /home/arihayri/GLAMpipe-data
PWD=$(shell pwd)


build: 
	docker create --name=glampipe_mongo mongo:3.2.10
	docker build -t artturimatias/glampipe .

start:
	docker start glampipe_mongo	
	docker run -it --rm --link glampipe_mongo:mongo --name glam -v $(DATA_DIR)/projects/:/glampipe/projects \
		-v $(NODE_DIR)/nodes:/glampipe/nodes \
		-v $(DATA_DIR)/tmp:/glampipe/tmp \
		-p 3000:3000  artturimatias/glampipe bash 
	
build_mongo:
	docker create --name=glampipe_mongo mongo:3.2.10	

start_mongo:
	docker start glampipe_mongo	

stop_mongo:
	docker stop glampipe_mongo	

build_glampipe:
	docker build -t artturimatias/glampipe .


start_glampipe:
	docker run -it --rm --link glampipe_mongo:mongo --name glampipe -v $(DATA_DIR)/projects/:/glampipe/projects \
		-v $(NODE_DIR)/nodes:/glampipe/nodes \
		-v $(DATA_DIR)/tmp:/glampipe/tmp \
		-p 3000:3000  artturimatias/glampipe bash 


clean:
	docker rm -f $(CONTAINERS)
	docker rmi -f $(IMAGES)


.PHONY: clean build_mongo start_mongo build_glampipe start_glampipe
