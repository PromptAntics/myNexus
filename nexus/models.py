from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User
from django.urls import reverse

class QuestionAnswer(models.Model):
    question = models.TextField()
    answer = models.TextField()
    category = models.CharField(max_length=100, default='general')  # Added field
    created = models.DateTimeField(auto_now_add=True)
    workspace_state = models.JSONField(null=True, blank=True)

class DebugInstance(models.Model):
    code = models.TextField()
    output = models.TextField(null=True, blank=True)
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"DebugInstance created on {self.created}"
