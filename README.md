zarafa-webapp-passwd
====================

The Passwd plugin allows the user to change his password inside of WebApp.

This plugin is largely based on the "Passwd" plugin by Andreas Brodowski.
For his original work check this [link](https://community.zarafa.com/pg/plugins/project/157/developer/dw2412/passwd-plugin)

## How to install
1. If you want to use this plugin with production / debug version of webapp then please download package from [community](__link_to_come__)
2. If you want to use this plugin with source copy of webapp then you can just download this whole project
3. Extract contents of this plugin to <webapp_path>/plugins directory
4. Give read permissions to apache for <webapp_path>/plugins/passwd directory
5. If you are using LDAP plugin then change PLUGIN_PASSWD_LDAP to true and also set proper values for PLUGIN_PASSWD_LDAP_BASEDN and PLUGIN_PASSWD_LDAP_URI configurations
6. If you are using DB plugin then no need to change anything, default configurations should be fine
5. Restart apache, reload webapp after clearing cache
6. If you want to enable this plugin by default for all users then edit config.php file and change PLUGIN_PASSWD_USER_DEFAULT_ENABLE setting to true

## How to enable
1. Go to settings section
2. Go to Plugins tab
3. Enable password change plugin and reload webapp
4. Go to Change Password tab of settings section
5. Provide current password and new password
6. Click on apply

## How to disable
1. Go to settings section
2. Go to Plugins tab
3. Disable password change plugin and reload webapp

## Notes
- Feedback/Bug Reports are welcome
- if anyone is good at creating icons then please help me add a good icon to change password tab (credits will be given)

## Todo
- add password strength meter on client side, so user can create complex passwords
- check on client side for empty fields