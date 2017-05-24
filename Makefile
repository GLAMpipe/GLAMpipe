
IMAGES := $(shell docker images -f "dangling=true" -q)
CONTAINERS := $(shell docker ps -a -q -f status=exited)
DATA_DIR := $(shell pwd)/glampipe-data


clean:
	docker rm -f $(CONTAINERS)
	docker rmi -f $(IMAGES)

create_network:
	docker network create --driver bridge gp

build_mongo:
	docker run -d --network=gp --name=mongo mongo

start_mongo:
	docker start mongo

stop_mongo:
	docker stop mongo      

build_glampipe:
	docker build -t artturimatias/glampipe .


start_glampipe:
	docker run -it --rm --network=gp --name glampipe \
		-v $(DATA_DIR):/glampipe-data \
		-p 3000:3000 \
		-e DOCKER=1 \
		 artturimatias/glampipe bash


.PHONY: clean build_mongo start_mongo build_glampipe start_glampipe
