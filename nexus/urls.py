'''
Nexus URLS, handed over from promptantics main app
'''
from django.urls import path
# from .views import (
#   PostListView, 
#   PostDetailView, 
#   PostCreateView,
#   PostUpdateView,
#   PostDeleteView,
#   UserPostListView
# )
from . import views # . is the current directory
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # path( url pattern, view, view's name)
    # path('', views.home, name='home'), # home page can just have an empty path ''
    path('', views.mynexus, name='my-nexus'), 
    path('home/', views.home, name='home'),
    path('dashboard/', views.dashboard, name='dashboard'),
    # path('', views.NexusIDE_View.as_view(), name='nexus-ide'),
    # path('ide/', views.NexusIDE_View.as_view(), name='nexus-ide'),

    path('generate/', views.generate, name='generate'),
    path('generate_image/', views.generate, name='generate_image'),
    path('generate_speech/', views.generate, name='generate_speech'),
    path('compile/', views.compile_code, name='compile'),
    path('debug/', views.debug_code, name='debug'),
    path('save_interaction/', views.save_interaction, name='save_interaction'),
    path('load_interaction/<int:interaction_id>/', views.load_interaction, name='load_interaction'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
