from django.contrib import admin
from .models import User
# Register your models here.

@admin.register(User)

class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'first_name', 'role','is_staff', 'is_active')
    list_filter = ('is_staff', 'is_active')
    search_fields = ('email', 'first_name')
    ordering = ('email',)
    
   
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name',)}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser')}),
    )
