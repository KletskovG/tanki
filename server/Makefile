DEFAULT: run

run:
	uv build
	uv run uvicorn main:app

docker-run:
	sudo docker run -d --name tanki-api  -p 127.0.0.1:8080:8000 kletskovg/tanki