from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import pipeline
import uvicorn

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize models with smaller variants
summarizer = pipeline("summarization", model="facebook/bart-base")
chat_model = pipeline("text2text-generation", model="google/flan-t5-small")

class TextRequest(BaseModel):
    text: str

class ChatRequest(BaseModel):
    message: str
    context: str

@app.post("/summarize")
async def summarize_text(request: TextRequest):
    try:
        summary = summarizer(request.text, max_length=150, min_length=50, do_sample=False)
        return {"summary": summary[0]["summary_text"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        prompt = f"Context: {request.context}\n\nQuestion: {request.message}\n\nAnswer:"
        response = chat_model(prompt, max_length=200, temperature=0.7, do_sample=True)
        return {"response": response[0]["generated_text"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)