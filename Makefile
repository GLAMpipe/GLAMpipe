
IMAGES := $(shell docker images -f "dangling=true" -q)
CONTAINERS := $(shell docker ps -a -q -f status=exited)
DATA_DIR := $(shell pwd)/glampipe-data


clean:
	docker rm -f $(CONTAINERS)
	docker rmi -f $(IMAGES)

create_network:
	docker network create --driver bridge glampipe_net

build_mongo:
	docker run -d --network=glampipe_net --name=mongo mongo

start:
	docker start mongo
	timeout 5
	make start_glampipe

start_mongo:
	docker start mongo

stop_mongo:
	docker stop mongo      

build_glampipe:
	docker build -t artturimatias/glampipe .


start_glampipe:
	docker run -it --rm --network=glampipe_net --name glampipe \
		-v $(DATA_DIR):/glampipe-data \
		-p 3000:3000 \
		-e DOCKER=1 \
		 artturimatias/glampipe bash

start_glampipe_dev:
	docker run -it --rm --network=glampipe_net --name glampipe \
		-v $(DATA_DIR):/glampipe-data \
		-p 3000:3000 \
		-e DOCKER=1 \
		 artturimatias/glampipe:dev bash




.PHONY: clean build_mongo start_mongo build_glampipe start_glampipe
