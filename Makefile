
IMAGES := $(shell docker images -f "dangling=true" -q)
CONTAINERS := $(shell docker ps -a -q -f status=exited)


clean:
	docker rm -f $(CONTAINERS)
	docker rmi -f $(IMAGES)

create_network:
	docker network create --driver bridge glampipe_net

build_mongo:
	docker run -d --network=glampipe_net -v mongo-data:/data/db --name=glampipe_mongo mongo:4.2

start_mongo:
	docker start glampipe_mongo

stop_mongo:
	docker stop glampipe_mongo

build:
	docker build -t artturimatias/glampipe .

start:
	docker run -d --network=glampipe_net --name glampipe \
		--mount type=bind,source="$(PWD)"/nodes,target=/src/app/nodes \
		--mount type=bind,source="$(PWD)"/data,target=/src/app/data \
		-p 3000:3000 \
		-e DOCKER=1 \
		 artturimatias/glampipe

stop:
	docker stop glampipe

restart:
	docker stop glampipe
	docker rm glampipe
	$(MAKE) start

bash:
	docker exec -it glampipe /bin/sh
