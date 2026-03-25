from rest_framework.decorators import api_view
from rest_framework.response import Response
from config.mongo import users_collection
from django.contrib.auth.hashers import make_password, check_password
from datetime import datetime
import re


print("VIEWS FILE LOADED")

@api_view(['POST'])
def register(request):
    data = request.data

    if users_collection.find_one({"email": data["email"]}):
        return Response({"error": "Email already exists"}, status=400)

    # password strength validation
    if not re.match(r'^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$', data.get("password", "")):
        return Response({"error": "Password must be at least 8 characters and include a number, an uppercase letter, and a special character."}, status=400)

    users_collection.insert_one({
        "name": data["name"],
        "email": data["email"],
        "password": make_password(data["password"]),
        "creationDate": datetime.now(),
        "loginDate": None
    })

    return Response({"message": "User registered successfully"})


@api_view(['POST'])
def login(request):
    data = request.data

    user = users_collection.find_one({"email": data["email"]})

    if not user:
        return Response({"error": "User not found"}, status=404)

    if not check_password(data["password"], user["password"]):
        return Response({"error": "Invalid password"}, status=400)

    # update loginDate to now
    now = datetime.now()
    users_collection.update_one(
        {"email": user["email"]},
        {"$set": {"loginDate": now}}
    )

    response_data = {
        "name": user["name"],
        "email": user["email"],
        "loginDate": now.isoformat()
    }
    # include creationDate if available
    if user.get("creationDate"):
        response_data["creationDate"] = user["creationDate"].isoformat()

    return Response(response_data)


@api_view(['GET'])
def profile(request):
    email = request.GET.get("email")

    user = users_collection.find_one({"email": email})

    if not user:
        return Response({"error": "User not found"}, status=404)

    user_response = {
        "name": user.get("name"),
        "email": user.get("email")
    }
    if user.get("creationDate"):
        user_response["creationDate"] = user["creationDate"].isoformat()
    if user.get("loginDate"):
        user_response["loginDate"] = user["loginDate"].isoformat()

    return Response({
        "user": user_response
    })


@api_view(['POST'])
def update_user(request):
    email = request.data.get("email")
    new_name = request.data.get("name")

    users_collection.update_one(
        {"email": email},
        {"$set": {"name": new_name}}
    )

    return Response({"message": "Profile updated"})



@api_view(['POST'])
def change_password(request):
    email = request.data.get("email")
    old_password = request.data.get("old_password")
    new_password = request.data.get("new_password")

    user = users_collection.find_one({"email": email})

    if not user:
        return Response({"error": "User not found"}, status=404)

    if not check_password(old_password, user["password"]):
        return Response({"error": "Incorrect current password"}, status=400)

    users_collection.update_one(
        {"email": email},
        {"$set": {"password": make_password(new_password)}}
    )

    return Response({"message": "Password updated successfully"})


@api_view(['POST'])
def delete_user(request):
    email = request.data.get("email")

    users_collection.delete_one({"email": email})

    from config.mongo import history_collection
    history_collection.delete_many({"email": email})

    return Response({"message": "User deleted"})