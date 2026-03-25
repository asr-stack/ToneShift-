from django.urls import path
from .views import register, login, profile, update_user, change_password, delete_user

urlpatterns = [
    path('register/', register),
    path('login/', login),
    path('profile/', profile),
    path('update/', update_user),
    path('change-password/', change_password),
    path('delete/', delete_user),
]