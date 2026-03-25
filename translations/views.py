from rest_framework.decorators import api_view
from rest_framework.response import Response
from config.mongo import translations_collection, history_collection
from datetime import datetime
import re
from django.core.mail import send_mail
from django.conf import settings

@api_view(['POST'])
def translate_text(request):
    try:
        text = request.data.get("text", "")
        tone = request.data.get("tone", "corporate")
        email = request.data.get("email")

        if not text:
            return Response({"error": "No text provided"}, status=400)

        translated = text

        # Get phrases from Mongo
        phrases = list(translations_collection.find())

        # Sort longest phrase first
        phrases.sort(key=lambda x: len(x.get("phrase", "")), reverse=True)

        for item in phrases:
            phrase = item.get("phrase")
            if not phrase:
                continue

            pattern = r'\b' + re.escape(phrase) + r'\b'
            replacement = item.get(tone, item.get("corporate", ""))

            translated = re.sub(pattern, replacement, translated, flags=re.IGNORECASE)

        # Do NOT auto-save translations here. Saving must be explicit
        # via the frontend 'save' action which calls `save_history`.

        return Response({"translated": translated})

    except Exception as e:
        print("TRANSLATION ERROR:", str(e))
        return Response({"error": "Translation failed"}, status=500)


@api_view(['GET'])
def get_history(request):
    email = request.GET.get("email")

    history = list(
        history_collection.find(
            {"email": email},
            {"_id": 0}
        ).sort("timestamp", -1)
    )

    return Response({"history": history})


@api_view(['POST'])
def delete_history_item(request):
    email = request.data.get("email")
    index = request.data.get("index")

    history = list(history_collection.find({"email": email}))

    if index < len(history):
        history_collection.delete_one({"_id": history[index]["_id"]})

    return Response({"message": "Deleted"})


@api_view(['POST'])
def clear_history(request):
    email = request.data.get("email")

    history_collection.delete_many({"email": email})

    return Response({"message": "All history cleared"})


@api_view(['POST'])
def save_history(request):
    """Explicit save endpoint used by the frontend. Prevents duplicate saves
    of the same translation for the same user (email + original + translated + tone).
    """
    email = request.data.get("email")
    original = request.data.get("original")
    translated = request.data.get("translated")
    tone = request.data.get("tone")

    if not email or not original or not translated:
        return Response({"error": "Missing fields"}, status=400)

    exists = history_collection.find_one({
        "email": email,
        "original": original,
        "translated": translated,
        "tone": tone
    })

    if exists:
        return Response({"message": "Already exists", "duplicate": True})

    history_collection.insert_one({
        "email": email,
        "original": original,
        "translated": translated,
        "tone": tone,
        "timestamp": datetime.utcnow()
    })

    return Response({"message": "Saved", "duplicate": False})


@api_view(['POST'])
def contact_form(request):
    name = request.data.get("name")
    email = request.data.get("email")
    subject = request.data.get("subject")
    message = request.data.get("message")

    if not name or not email or not subject or not message:
        return Response({"error": "All fields are required"}, status=400)

    full_message = f"""
    New Contact Message from ToneShift:

    Name: {name}
    Email: {email}

    Message:
    {message}
    """

    send_mail(
        subject=f"ToneShift Contact: {subject}",
        message=full_message,
        from_email=None,  # uses DEFAULT_FROM_EMAIL
        recipient_list=["tonesift@gmail.com"],
        fail_silently=False,
    )

    return Response({"message": "Message sent successfully"})