import chainlit as cl
from google import genai
import asyncio

# Initialize the Gemini Client. 
client = genai.Client() 

@cl.on_message
async def main(message: cl.Message):
    # SCENARIO 1: The user uploaded a file
    if message.elements:
        file = message.elements[0]
        
        pdf_element = cl.Pdf(name=file.name, display="side", path=file.path)
        msg = cl.Message(content=f"**Uploading `{file.name}` to secure AI environment...**\n\n", elements=[pdf_element])
        await msg.send()

        try:
            # Use native asyncio to safely run the upload in the background
            uploaded_doc = await asyncio.to_thread(client.files.upload, file=file.path)
            
            # Save the document in the current chat session
            cl.user_session.set("uploaded_doc", uploaded_doc)
            
            msg.content = f"✅ `{file.name}` is ready! What would you like to know about it?"
            await msg.update()
            
        except Exception as e:
            msg.content = f"Error uploading document: {str(e)}"
            await msg.update()
            
        return

    # SCENARIO 2: The user is asking a text question
    uploaded_doc = cl.user_session.get("uploaded_doc")
    
    if not uploaded_doc:
        await cl.Message(content="Please upload a PDF file first using the paperclip icon!").send()
        return
        
    msg = cl.Message(content="Scanning document...")
    await msg.send()
    
    try:
        # Use native asyncio to safely run the generation in the background
        response = await asyncio.to_thread(
            client.models.generate_content,
            model='gemini-3.6-flash',
            contents=[message.content, uploaded_doc]
        )
        
        # Output the AI's answer
        msg.content = response.text
        await msg.update()
        
    except Exception as e:
        msg.content = f"Error generating answer: {str(e)}"
        await msg.update()
