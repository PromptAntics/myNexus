# forms that inherits from user creation form
from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm
from .models import Profile


class UserRegisterForm(UserCreationForm): # inherites from the UserCreationForm and adds a email input
  email = forms.EmailField() #required = true is default

  class Meta:
    # gives a nested name space for configurations and keeps configs in one place
    model = User
    fields = ['username', 'email', 'password1', 'password2'] # fields that we want in the form, in order

class UserUpdateForm(forms.ModelForm):
  email = forms.EmailField()
  class Meta:
    model = User
    fields = ['username', 'email'] 

class ProfileUpdateForm(forms.ModelForm):
  class Meta:
    model = Profile 
    fields = ['image']