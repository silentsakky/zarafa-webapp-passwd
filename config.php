<?php
/** Enable the passwd plugin for all clients **/
define('PLUGIN_PASSWD_USER_DEFAULT_ENABLE', true);

/** Define zarafa installtion uses LDAP **/
define('PLUGIN_PASSWD_LDAP', false);

/** Base DN to access LDAP users **/
define('PLUGIN_PASSWD_LDAP_BASEDN', 'dc=example,dc=com');

/** URI to access LDAP server **/
define('PLUGIN_PASSWD_LDAP_URI', 'localhost');
?>