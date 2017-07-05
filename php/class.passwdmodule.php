<?php
/**
 * Passwd module.
 * Module that will be used to change passwords of the user
 */
class PasswdModule extends Module
{
	/**
	 * Process the incoming events that were fire by the client.
	 */
	public function execute()
	{
		foreach($this->data as $actionType => $actionData)
		{
			if(isset($actionType)) {
				try {
					switch($actionType)
					{
						case 'save':
							$this->save($actionData);
							break;
						default:
							$this->handleUnknownActionType($actionType);
					}
				} catch (MAPIException $e) {
					$this->sendFeedback(false, $this->errorDetailsFromException($e));
				}

			}
		}
	}

	/**
	 * Change the password of user. Do some calidation and call proper methods based on
	 * zarafa setup.
	 * @param {Array} $data data sent by client.
	 */
	public function save($data)
	{
		$errorMessage = '';

		// some sanity checks
		if(empty($data)) {
			$errorMessage = dgettext("plugin_passwd", 'No data received.');
		}

		if(empty($data['username'])) {
			$errorMessage = dgettext("plugin_passwd", 'User name is empty.');
		}

		if(empty($data['current_password'])) {
			$errorMessage = dgettext("plugin_passwd", 'Current password is empty.');
		}

		if(empty($data['new_password']) || empty($data['new_password_repeat'])) {
			$errorMessage = dgettext("plugin_passwd", 'New password is empty.');
		}

		if($data['new_password'] !== $data['new_password_repeat']) {
			$errorMessage = dgettext("plugin_passwd", 'New passwords do not match.');
		}

		if(empty($errorMessage)) {
			if(PLUGIN_PASSWD_LDAP) {
				$this->saveInLDAP($data);
			} else {
				$this->saveInDB($data);
			}
		} else {
			$this->sendFeedback(false, array(
				'type' => ERROR_ZARAFA,
				'info' => array(
					'display_message' => $errorMessage
				)
			));
		}
	}

	/**
	 * Function will connect to LDAP and will try to modify user's password.
	 * @param {Array} $data data sent by client.
	 */
	public function saveInLDAP($data)
	{
		$errorMessage = '';
		$userName = $data['username'];
		$newPassword = $data['new_password'];
		$sessionPass = '';

		// connect to LDAP server
		$ldapconn = ldap_connect(PLUGIN_PASSWD_LDAP_URI);

		// check connection is successfull
		if(ldap_errno($ldapconn) === 0) {
			// get the users uid, if we have a multi tenant installation then remove company name from user name
			if (PLUGIN_PASSWD_LOGIN_WITH_TENANT){
				$parts = explode('@', $userName);
				$uid = $parts[0];
			} else {
				$uid = $userName;
			}

			// check if we should use tls!
			if(strrpos(PLUGIN_PASSWD_LDAP_URI, "ldaps://", -strlen(PLUGIN_PASSWD_LDAP_URI)) === FALSE && PLUGIN_PASSWD_LDAP_USE_TLS === true) {
				ldap_start_tls($ldapconn);
			}

			// set connection parametes
			ldap_set_option($ldapconn, LDAP_OPT_PROTOCOL_VERSION, 3);
			ldap_set_option($ldapconn, LDAP_OPT_REFERRALS, 0);

			// now bind to the ldap server to search the user dn
			ldap_bind($ldapconn, PLUGIN_PASSWD_LDAP_BIND_DN, PLUGIN_PASSWD_LDAP_BIND_PW);

			// search for the user dn that will be used to do login into LDAP
			$userdn = ldap_search (
				$ldapconn,						// connection-identify
				PLUGIN_PASSWD_LDAP_BASEDN,		// basedn
				'uid=' . $uid,					// search filter
				array('dn', 'objectClass')	// needed attributes. we need dn and objectclass
			);

			if ($userdn) {
				$entries = ldap_get_entries($ldapconn, $userdn);
				$userdn = $entries[0]['dn'];

				// bind to ldap directory
				// login with current password if that fails then current password is wrong
				ldap_bind($ldapconn, $userdn, $data['current_password']);

				if(ldap_errno($ldapconn) === 0) {
					$password_hash = $this->sshaEncode($newPassword);
					$entry = array('userPassword' => $password_hash);

					if (in_array('sambaSamAccount', $entries[0]['objectclass'])) {
						$nthash = strtoupper(bin2hex(mhash(MHASH_MD4, iconv("UTF-8", "UTF-16LE", $newPassword))));
						$entry['sambaNTPassword'] = $nthash;
						$entry['sambaPwdLastSet'] = strval(time());
					}

					ldap_modify($ldapconn, $userdn, $entry);
					if (ldap_errno($ldapconn) === 0) {
						// password changed successfully

						// send feedback to client
						$this->sendFeedback(true, array(
							'info' => array(
								'display_message' => dgettext("plugin_passwd", 'Password is changed successfully.')
							)
						));

						// write new password to session because we don't want user to re-authenticate
						session_start();
						$encryptionStore = EncryptionStore::getInstance();
						$encryptionStore->add('password', $newPassword);
						session_write_close();

						return true;
					} else {
						$errorMessage = dgettext("plugin_passwd", 'Password is not changed.');
					}
				} else {
					$errorMessage = dgettext("plugin_passwd", 'Current password does not match.');
				}

				// release ldap-bind
				ldap_unbind($ldapconn);
			}
		}

		if(!empty($errorMessage)) {
			$this->sendFeedback(false, array(
				'type' => ERROR_ZARAFA,
				'info' => array(
					'ldap_error' => ldap_errno($ldapconn),
					'ldap_error_name' => ldap_error($ldapconn),
					'display_message' => $errorMessage
				)
			));
		}
	}

	/**
	 * Function will try to change user's password via MAPI in SOAP connection.
	 * @param {Array} $data data sent by client.
	 */
	public function saveInDB($data)
	{
		$errorMessage = '';
		$userName = $data['username'];
		$newPassword = $data['new_password'];
		$sessionPass = '';

		// get current session password
		// if this plugin is used on a webapp version with EncryptionStore,
		// $_SESSION['password'] is no longer available. User EncryptionStore
		// in this case.
		// EncryptionStore was introduced in webapp core somewhere after
		// version 2.1.2, and with or before version 2.2.0.414.
		// tested with Zarafa WebApp 2.2.1.43-199.1 running with
		// Zarafa Server 7.2.4.29-99.1
		if(class_exists("EncryptionStore")) {
			$encryptionStore = EncryptionStore::getInstance();
			$sessionPass = $encryptionStore->get("password");
		}

		if($data['current_password'] === $sessionPass) {
			// all information correct, change password
			$store = $GLOBALS['mapisession']->getDefaultMessageStore();
			$userinfo = mapi_zarafa_getuser_by_name($store, $userName);

			if (mapi_zarafa_setuser($store, $userinfo['userid'], $userName, $userinfo['fullname'], $userinfo['emailaddress'], $newPassword, 0, $userinfo['admin'])) {
				// password changed successfully

				// send feedback to client
				$this->sendFeedback(true, array(
					'info' => array(
						'display_message' => dgettext("plugin_passwd", 'Password is changed successfully.')
					)
				));

				// write new password to session because we don't want user to re-authenticate
				session_start();
				$encryptionStore = EncryptionStore::getInstance();
				$encryptionStore->add('password', $newPassword);
				session_write_close();

				return true;
			} else {
				$errorMessage = dgettext("plugin_passwd", 'Password is not changed.');
			}
		} else {
			$errorMessage = dgettext("plugin_passwd", 'Current password does not match.');
		}

		if(!empty($errorMessage)) {
			$this->sendFeedback(false, array(
				'type' => ERROR_ZARAFA,
				'info' => array(
					'display_message' => $errorMessage
				)
			));
		}
	}

	/**
	 * Function will generate SSHA hash to use to store user's password in LDAP.
	 * @param {String} $text text based on which hash will be generated.
	 */
	function sshaEncode($text)
	{
		$salt = '';
		for ($i=1; $i<=10; $i++) {
			$salt .= substr('0123456789abcdef', rand(0, 15), 1);
		}

		$hash = '{SSHA}' . base64_encode(pack('H*',sha1($text . $salt)) . $salt);

		return $hash;
	}
}
?>
