from django.db import models

class Slang(models.Model):
    phrase = models.CharField(max_length=200, unique=True)
    corporate = models.TextField()
    academic = models.TextField()
    formal = models.TextField()

    def __str__(self):
        return self.phrase


class Translation(models.Model):
    email = models.EmailField()
    original = models.TextField()
    translated = models.TextField()
    tone = models.CharField(max_length=50)
    timestamp = models.DateTimeField(auto_now_add=True)