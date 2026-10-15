
from __future__ import annotations

import os
import hmac
from io import BytesIO
from urllib.parse import urlparse
import modal
from pydantic import BaseModel, HttpUrl

app = modal.App("lostfound-face-api")

image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install(
        "build-essential",
        "cmake",
        "libopenblas-dev",
        "liblapack-dev",
    )
    .pip_install(
        "fastapi",
        "pydantic",
        "python-multipart",
        "requests",
        "Pillow",
        "numpy",
        "face-recognition==1.3.0",
    )
)

class EncodeRequest(BaseModel):
    image_url: HttpUrl

@app.function(
    image=image,
    secrets=[modal.Secret.from_name("lostandfound-secret")],
    timeout=120,
    memory=4096,
)
@modal.asgi_app()
def web_app():
    from fastapi import FastAPI, File, Header, HTTPException, UploadFile
    from pydantic import BaseModel, HttpUrl
    import face_recognition
    import requests
    import numpy as np
    from PIL import Image, UnidentifiedImageError
    api = FastAPI(title="Lost and Found Face API")

    def authorize(authorization: str | None) -> None:
        expected_key = os.environ.get("FACE_API_KEY", "")
        supplied_key = (
            authorization.removeprefix("Bearer ").strip()
            if authorization
            else ""
        )
        if not expected_key or not hmac.compare_digest(
            supplied_key, expected_key
        ):
            raise HTTPException(status_code=401, detail="Unauthorized")

    def encode_image(data: bytes):
        if len(data) > 10 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="Image exceeds 10 MB")

        try:
            with Image.open(BytesIO(data)) as img:
                img = img.convert("RGB")
                img.thumbnail((1600, 1600))
                encodings = face_recognition.face_encodings(np.array(img))
        except (UnidentifiedImageError, OSError, ValueError):
            raise HTTPException(
                status_code=400,
                detail="Could not process image",
            )

        if len(encodings) == 0:
            raise HTTPException(status_code=422, detail="No face detected")
        if len(encodings) > 1:
            raise HTTPException(status_code=422, detail="Multiple faces detected")

        return {
            "encoding": encodings[0].tolist(),
            "algorithm_version": "face_recognition_v1",
            "faces_detected": 1,
        }

    @api.get("/")
    def health():
        return {
            "status": "ok",
            "service": "lostfound-face-api",
        }

    @api.post("/encode")
    def encode_face(
        body: EncodeRequest,
        authorization: str | None = Header(default=None),
    ):
        authorize(authorization)

        url = str(body.image_url)
        parsed = urlparse(url)

        if (
            parsed.scheme != "https"
            or parsed.hostname != "res.cloudinary.com"
            or parsed.port is not None
            or parsed.username is not None
            or parsed.password is not None
        ):
            raise HTTPException(
                status_code=400,
                detail="Only HTTPS Cloudinary URLs are allowed",
            )

        try:
            with requests.get(
                url,
                stream=True,
                timeout=(5, 20),
                allow_redirects=False,
            ) as response:
                response.raise_for_status()

                content_type = response.headers.get(
                    "Content-Type", ""
                ).split(";")[0].lower()

                if not content_type.startswith("image/"):
                    raise HTTPException(
                        status_code=400,
                        detail="URL did not return an image",
                    )

                data = response.content
            return encode_image(data)

        except HTTPException:
            raise
        except requests.RequestException:
            raise HTTPException(
                status_code=400,
                detail="Could not download image",
            )
        except (
            UnidentifiedImageError,
            OSError,
            ValueError,
        ):
            raise HTTPException(
                status_code=400,
                detail="Could not process image",
            )

    @api.post("/encode-upload")
    async def encode_uploaded_face(
        file: UploadFile = File(...),
        authorization: str | None = Header(default=None),
    ):
        authorize(authorization)
        data = await file.read()
        return encode_image(data)

    return api
