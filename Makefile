
IMAGES := $(shell docker images -f "dangling=true" -q)
CONTAINERS := $(shell docker ps -a -q -f status=exited)
VOLUME := glampipe-data


clean:
	docker rm -f $(CONTAINERS)
	docker rmi -f $(IMAGES)

create_network:
	docker network create --driver bridge glampipe_net

create_volume:
	docker volume create glampipe-data

build_mongo:
	docker run -d --network=glampipe_net --name=glampipe_mongo mongo:3.5

start:
	docker start glampipe_mongo
	timeout 5
	make start_glampipe

start_mongo:
	docker start glampipe_mongo

stop_mongo:
	docker stop glampipe_mongo      

build_glampipe:
	docker build -t artturimatias/glampipe .


start_glampipe:
	docker run -it --rm --network=glampipe_net --name glampipe \
		-v $(VOLUME):/glampipe-data \
		-p 3000:3000 \
		-e DOCKER=1 \
		 artturimatias/glampipe bash

start_glampipe_dev:
	docker run -it --rm --network=glampipe_net --name glampipe \
		-v $(DVOLUME):/glampipe-data \
		-p 3000:3000 \
		-e DOCKER=1 \
		 artturimatias/glampipe:dev bash




.PHONY: clean build_mongo start_mongo build_glampipe start_glampipe
