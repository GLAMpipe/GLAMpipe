
IMAGES := $(shell docker images -f "dangling=true" -q)
CONTAINERS := $(shell docker ps -a -q -f status=exited)
VOLUME := glampipe-data-rw


clean:
	docker rm -f $(CONTAINERS)
	docker rmi -f $(IMAGES)

create_network:
	docker network create --driver bridge glampipe_net

create_volume:
	docker volume create glampipe-data-rw

build_mongo:
	docker run -d --network=glampipe_net --name=glampipe_mongo mongo:3.6

start:
	docker start glampipe_mongo
	timeout 5
	make start_glampipe

start_mongo:
	docker start glampipe_mongo

stop_mongo:
	docker stop glampipe_mongo

build:
	docker build -t artturimatias/glampipe_rw .


start:
	docker run -d --network=glampipe_net --name glampipe_rw \
		--mount type=bind,source="$(PWD)"/nodes,target=/src/app/nodes \
		--mount type=bind,source="$(PWD)"/glampipe-data,target=/glampipe-data \
		-p 3000:3000 \
		-e DOCKER=1 \
		 artturimatias/glampipe_rw

start_glampipe_dev:
	docker run -it --rm --network=glampipe_net --name glampipe_rw \
		-v $(DVOLUME):/glampipe-data \
		--mount type=bind,source="$(PWD)"/nodes,target=/src/app/nodes \
		-p 3333:3333 \
		-e DOCKER=1 \
		 artturimatias/glampipe_rw:dev bash




.PHONY: clean build_mongo start_mongo build_glampipe start_glampipe
