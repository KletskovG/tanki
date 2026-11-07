from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import routes

app = FastAPI(openapi_url=None)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://tanki.website.yandexcloud.net"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes.router)
