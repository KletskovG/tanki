from fastapi import FastAPI
import routes

app = FastAPI(openapi_url=None)

app.include_router(routes.router)