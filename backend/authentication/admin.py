from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'first_name', 'last_name', 'role', 'is_staff', 'is_active')
    
    list_filter = ('role', 'is_staff', 'is_active', 'is_superuser')
    search_fields = ('email', 'first_name', 'last_name', 'phone_number')
   
    ordering = ('email',)
    
    # Fields in the add/edit form
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'phone_number')}),
        ('Organization Details', {'fields': ('organization', 'role')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    # Fields in the add form (when creating a new user)
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'first_name', 'last_name', 'role', 'organization', 'phone_number'),
        }),
    )
    
    readonly_fields = ('last_login', 'date_joined')
    
    # Actions available in the list view
    actions = ['make_active', 'make_inactive', 'set_as_employee', 'set_as_learner', 'set_as_admin']
    
    def make_active(self, request, queryset):
        queryset.update(is_active=True)
    make_active.short_description = "Mark selected users as active"
    
    def make_inactive(self, request, queryset):
        queryset.update(is_active=False)
    make_inactive.short_description = "Mark selected users as inactive"
    
    def set_as_employee(self, request, queryset):
        queryset.update(role='EMPLOYEE')
    set_as_employee.short_description = "Set selected users as Employees"
    
    def set_as_learner(self, request, queryset):
        queryset.update(role='LEARNER')
    set_as_learner.short_description = "Set selected users as Learners"
    
    def set_as_admin(self, request, queryset):
        queryset.update(role='ADMIN')
    set_as_admin.short_description = "Set selected users as Admins"