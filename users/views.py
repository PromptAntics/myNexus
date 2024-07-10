from django.shortcuts import render, redirect
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import logout
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from .forms import UserRegisterForm, UserUpdateForm, ProfileUpdateForm


def register(request):
  if request.method == 'POST':
    form = UserRegisterForm(request.POST) # instantiates a user creaton with post data
    if form.is_valid():
      form.save() # saves the user, saves to db
      username = form.cleaned_data.get('username') # validated form data will be in the cleaned_data dictionary
      # messages.success(request, f'Account created for {username}!') # green box for success
      messages.success(request, f'Your account has been created! You are now able to log in.')
      return redirect('login')

  else:
    form = UserRegisterForm()
  return render(request, 'users/register.html', {'form': form})

def logout_view(request): # since this is django 3.4+
  logout(request)
  return render(request, 'users/logout.html')

@login_required # python decorator
def profile(request):
  if request.method == 'POST': # create the forms if its the POST method, possibly pass in new data
    u_form = UserUpdateForm(request.POST, instance=request.user)
    # post data passed with request.POST, the 2nd param is b/c it needs to know which user and profile to update
    p_form = ProfileUpdateForm(request.POST, 
                               request.FILES, 
                               instance=request.user.profile) # file data incoming, the pfp user tryna upload
    if u_form.is_valid() and p_form.is_valid(): # save only if fields are valid
      u_form.save()
      p_form.save()  
      messages.success(request, f'Your account has been updated!')
      return redirect('profile')  # redirect because POST-GET redirect pattern. Sends Get request to prevent the pop up annoyance


  else: 
    u_form = UserUpdateForm(instance=request.user)
    p_form = ProfileUpdateForm(instance=request.user.profile)

  context = {
    'u_form': u_form,
    'p_form': p_form
  }

  return render(request, 'users/profile.html', context)