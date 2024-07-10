from django.db import models
from django.contrib.auth.models import User
from PIL import Image
# Create your models here.

class Profile(models.Model): # create 1-1 relationship between user to pfp
  user = models.OneToOneField(User, on_delete=models.CASCADE) # have 1-1 rel btw user to model
  # CASCADE = if user is deleted, pfp delete also. if pfp delete, user no delete
  image = models.ImageField(default='default.jpg',upload_to='profile_pics') # profile_pics is the directory

  def __str__(self):
    return f'{self.user.username} Profile'
  
  def save(self, *args, **kwargs): # save is already a method but this adds to/modifies it
    super().save()

    img = Image.open(self.image.path) # opens image of current instance
    if img.height > 300 or img.width > 300:
      output_size = (300,300) #tuple of the max size
      img.thumbnail(output_size) 
      img.save(self.image.path) # overrides to our path
      # can be optimized for further efficiency once this site grows