from django.db.models.signals import post_save  # fires signal when post gets saved
from django.contrib.auth.models import User # sender of signal
from django.dispatch import receiver # reciever of signal, and executes something
from .models import Profile

@receiver(post_save, sender=User) # runs function everytime a user gets created
def create_profile(sender, instance, created, **kwargs):
  if created:
    Profile.objects.create(user=instance) # this instance would be the very user being created

@receiver(post_save, sender=User)
def save_profile(sender, instance, **kwargs):
  instance.profile.save()
