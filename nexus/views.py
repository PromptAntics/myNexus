import os
import logging
from datetime import date, timedelta
from django.conf import settings
from django.shortcuts import render, get_object_or_404, redirect
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from .models import QuestionAnswer
import json
import PyPDF2
import docx
from PIL import Image
from io import BytesIO
from openai import OpenAI

# Initialize logging
logger = logging.getLogger(__name__)

# Instantiate the OpenAI client
client = OpenAI(api_key="your-openai-api-key")

def load_data(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = f.read()
        logger.debug(f"Loaded data from {file_path}")
        return data
    except FileNotFoundError:
        logger.error(f"File not found: {file_path}")
        return ""

BASE_DIR = settings.BASE_DIR
aql_data_path = os.path.join(BASE_DIR, 'nexus/data/aql-nexus-data.json')
copilot_prompt_path = os.path.join(BASE_DIR, 'nexus/data/copilot.txt')
compiler_prompt_path = os.path.join(BASE_DIR, 'nexus/data/compiler.txt')
debugger_prompt_path = os.path.join(BASE_DIR, 'nexus/data/debugger.txt')

aql_data = load_data(aql_data_path)
copilot_prompt = load_data(copilot_prompt_path)
compiler_prompt = load_data(compiler_prompt_path)
debugger_prompt = load_data(debugger_prompt_path)

def get_combined_prompt(user_input, system_prompt, context, max_context_length=1500):
    context_length = len(context)
    if context_length > max_context_length:
        context = context[:max_context_length] + "..."
    combined_prompt = f"{system_prompt}\n\nContext:\n{context}\n\nUser Input:\n{user_input}"
    logger.debug(f"Combined Prompt: {combined_prompt}")
    return combined_prompt

combined_copilot_prompt = get_combined_prompt(copilot_prompt, aql_data, aql_data, max_context_length=1500)
combined_compiler_prompt = get_combined_prompt(compiler_prompt, aql_data, aql_data, max_context_length=1500)
combined_debugger_prompt = get_combined_prompt(debugger_prompt, aql_data, aql_data, max_context_length=1500)

def truncate_message(message, max_tokens):
    tokens = message.split()
    if len(tokens) > max_tokens:
        return ' '.join(tokens[:max_tokens]) + '...'
    return message

def generate_response(user_input, combined_prompt, output_format="text"):
    messages = [
        {"role": "system", "content": combined_prompt}
    ]

    logger.debug("Messages being sent to OpenAI:")
    for msg in messages:
        logger.debug(f"Role: {msg['role']}, Content: {msg['content']}")

    try:
        if output_format == "text":
            completion = client.chat.completions.create(
                model="gpt-4",
                messages=messages,
                max_tokens=2000,
                temperature=0.7,
                top_p=0.6
            )
            return completion.choices[0].message.content.strip()
        elif output_format == "image":
            completion = client.images.generate(
                prompt=user_input,
                n=1,
                size="1024x1024"
            )
            return completion.data[0].url
        else:
            return "Invalid output format"
    except Exception as e:
        logger.error(f"Error generating response: {str(e)}")
        return f"Error generating response: {str(e)}"

def extract_pdf_text(file):
    reader = PyPDF2.PdfReader(file)
    text = ""
    for page in reader.pages:
        text += page.extract_text()
    return text

def extract_docx_text(file):
    doc = docx.Document(file)
    text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
    return text

def extract_image_text(file):
    try:
        image = Image.open(file)
        image_bytes = BytesIO()
        image.save(image_bytes, format=image.format)
        image_bytes.seek(0)
        return image_bytes.read().decode('utf-8')
    except Exception as e:
        return f"[Unable to read image content: {e}]"

def truncate_text(text, max_length=5000):
    if isinstance(text, bytes):
        text = text.decode('utf-8', errors='ignore')
    if len(text) > max_length:
        return text[:max_length] + "...[truncated]"
    return text

@csrf_exempt
def generate(request):
    if request.method == 'POST':
        input_text = request.POST.get("text", "")
        logger.debug(f"Received User Input: {input_text}")

        files_data = []
        output_format = request.POST.get("output_format", "text")

        for key in request.FILES:
            file = request.FILES[key]
            if file.name.endswith('.pdf'):
                try:
                    content = extract_pdf_text(file)
                except Exception as e:
                    content = f"[Unable to read PDF content: {e}]"
            elif file.name.endswith('.docx'):
                try:
                    content = extract_docx_text(file)
                except Exception as e:
                    content = f"[Unable to read DOCX content: {e}]"
            elif file.name.endswith(('.png', '.jpg', '.jpeg', '.gif')):
                try:
                    content = extract_image_text(file)
                except Exception as e:
                    content = f"[Unable to read image content: {e}]"
            else:
                try:
                    content = file.read().decode('utf-8')
                except UnicodeDecodeError:
                    content = "[Unable to decode file content]"

            content = truncate_text(content)
            files_data.append(f"Filename: {file.name}\nContent: {content}")

        input_text += "\n\n".join(files_data)
        logger.debug(f"User Input with File Content: {input_text}")

        # Combine user input with the system prompt
        combined_prompt = get_combined_prompt(input_text, copilot_prompt, aql_data, max_context_length=1500)
        logger.debug(f"Combined Prompt: {combined_prompt}")

        # Generate response with the combined prompt
        generated_text = generate_response(input_text, combined_prompt, output_format)
        logger.debug(f"Generated Response: {generated_text}")

        # Save interaction to the database
        QuestionAnswer.objects.create(question=input_text, answer=generated_text)

        return JsonResponse({"generated_text": generated_text})

    return JsonResponse({"error": "Invalid request"}, status=405)

@csrf_exempt
def compile_code(request):
    if request.method == 'POST':
        code_input = request.POST.get('text', "")
        logger.debug(f"Received Code Input: {code_input}")
        output_format = request.POST.get('output_format', 'text')
        files_data = []

        for key in request.FILES:
            file = request.FILES[key]
            if file.name.endswith('.pdf'):
                try:
                    content = extract_pdf_text(file)
                except Exception as e:
                    content = f"[Unable to read PDF content: {e}]"
            elif file.name.endswith('.docx'):
                try:
                    content = extract_docx_text(file)
                except Exception as e:
                    content = f"[Unable to read DOCX content: {e}]"
            elif file.name.endswith(('.png', '.jpg', '.jpeg', '.gif')):
                try:
                    content = extract_image_text(file)
                except Exception as e:
                    content = f"[Unable to read image content: {e}]"
            else:
                try:
                    content = file.read().decode('utf-8')
                except UnicodeDecodeError:
                    content = "[Unable to decode file content]"

            content = truncate_text(content)
            files_data.append(f"Filename: {file.name}\nContent: {content}")

        code_input += "\n\n".join(files_data)
        logger.debug(f"Code Input with File Content: {code_input}")

        # Combine user input with the system prompt
        combined_prompt = get_combined_prompt(code_input, compiler_prompt, aql_data, max_context_length=1500)
        logger.debug(f"Combined Prompt: {combined_prompt}")

        # Generate response with the combined prompt
        result = generate_response(code_input, combined_prompt, output_format)
        logger.debug(f"Generated Compilation Result: {result}")

        # Save interaction to the database
        QuestionAnswer.objects.create(question=code_input, answer=result)

        return JsonResponse({'result': result})

    return JsonResponse({'error': 'Invalid request method'}, status=405)

@csrf_exempt
def debug_code(request):
    if request.method == 'POST':
        debug_input = request.POST.get('text', "")
        logger.debug(f"Received Debug Input: {debug_input}")
        files_data = []

        for key in request.FILES:
            file = request.FILES[key]
            if file.name.endswith('.pdf'):
                try:
                    content = extract_pdf_text(file)
                except Exception as e:
                    content = f"[Unable to read PDF content: {e}]"
            elif file.name.endswith('.docx'):
                try:
                    content = extract_docx_text(file)
                except Exception as e:
                    content = f"[Unable to read DOCX content: {e}]"
            elif file.name.endswith(('.png', '.jpg', '.jpeg', '.gif')):
                try:
                    content = extract_image_text(file)
                except Exception as e:
                    content = f"[Unable to read image content: {e}]"
            else:
                try:
                    content = file.read().decode('utf-8')
                except UnicodeDecodeError:
                    content = "[Unable to decode file content]"

            content = truncate_text(content)
            files_data.append(f"Filename: {file.name}\nContent: {content}")

        debug_input += "\n\n".join(files_data)
        logger.debug(f"Debug Input with File Content: {debug_input}")

        # Combine user input with the system prompt
        combined_prompt = get_combined_prompt(debug_input, debugger_prompt, aql_data, max_context_length=1500)
        logger.debug(f"Combined Prompt: {combined_prompt}")

        # Generate response with the combined prompt
        result = generate_response(debug_input, combined_prompt, output_format="text")
        logger.debug(f"Generated Debug Result: {result}")

        # Save interaction to the database
        QuestionAnswer.objects.create(question=debug_input, answer=result)

        return JsonResponse({'result': result})

    return JsonResponse({'error': 'Invalid request method'}, status=405)

@csrf_exempt
def save_interaction(request):
    if request.method == 'POST':
        body = json.loads(request.body)
        question = body.get("question")
        answer = body.get("answer")
        workspace_state = body.get("workspace_state", {})

        if not question or not answer:
            return JsonResponse({"error": "Invalid data"}, status=400)

        # Save the interaction to the database
        QuestionAnswer.objects.create(
            question=question,
            answer=answer,
            workspace_state=workspace_state
        )

        return JsonResponse({"success": "Interaction saved"})

    return JsonResponse({"error": "Invalid request"}, status=405)

@csrf_exempt
def load_interaction(request, interaction_id):
    try:
        interaction = get_object_or_404(QuestionAnswer, pk=interaction_id)
        return JsonResponse({
            "question": interaction.question,
            "answer": interaction.answer,
            "workspace_state": interaction.workspace_state
        })
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

def ide_view(request):
    today = date.today()
    yesterday = today - timedelta(days(1))
    seven_days_ago = today - timedelta(days(7))

    questions = QuestionAnswer.objects.all()
    t_questions = questions.filter(created__date=today)
    y_questions = questions.filter(created__date=yesterday)
    s_questions = questions.filter(created__date__gte=seven_days_ago, created__date__lte=today)

    context = {"t_questions": t_questions, "y_questions": y_questions, "s_questions": s_questions}
    return render(request, 'nexus/ide.html', context)

def ide(request):
    return render(request, 'nexus/ide.html', {'title': 'My Nexus'})

def home(request):
    return render(request, 'nexus/home.html', {'title': 'AQL'})

def mynexus(request):
    return render(request, 'nexus/my-nexus.html', {'title': 'My Nexus'})

def dashboard(request):
    return render(request, 'nexus/dashboard.html', {'title': 'Dash'})

def landing(request):
    return render(request, 'nexus/landing.html', {'title': 'Welcome'})
