from django.urls import path
from .views import translate_text, get_history, delete_history_item, clear_history, save_history, contact_form

urlpatterns = [
    path('translate/', translate_text),
    path('history/', get_history),
    path('history/delete/', delete_history_item),
    path('history/clear/', clear_history),
    path('save/', save_history),
    path('translate/', translate_text),
    path('contact/', contact_form),
]