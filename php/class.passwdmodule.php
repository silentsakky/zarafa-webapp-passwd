<?php
/**
 * Passwd module.
 *
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

	public function save($data)
	{
		// some sanity checks
		if(empty($data)) {
			$this->sendFeedback(false);
		}

		if(empty($data['username']) || empty($data['current_password']) || empty($data['new_password']) || empty($data['new_password_repeat'])) {
			$this->sendFeedback(false);
		}

		if(PLUGIN_PASSWD_LDAP) {
			$this->saveInLDAP($data);
		} else {
			$this->saveInDB($data);
		}
	}

	public function saveInLDAP($data)
	{
		$errorMessage = '';

		// connect to LDAP server
		$ldapconn = ldap_connect(PLUGIN_PASSWD_LDAP_URI);

		// check connection is successfull
		if(ldap_errno($ldapconn) === 0) {
			// search for the user dn that will be used to do login into LDAP
			$userdn = ldap_search (
				$ldapconn,						// connection-identify
				PLUGIN_PASSWD_LDAP_BASEDN,		// basedn
				"uid=".$uid,					// search filter
				array("dn")						// needed attributes. we need the dn
			);

			if ($userdn) {
				$userdn = ldap_get_entries($ldapconn, $userdn);
				$userdn = $userdn[0]['dn'];

				// bind to ldap directory
				ldap_set_option($ds, LDAP_OPT_PROTOCOL_VERSION, 3);

				// login with current password if that fails then current password is wrong
				$bind = ldap_bind($ladpconn, $userdn, $data['current_password']);

				if(ldap_errno($ldapconn) === 0) {
					$passwd = $data['new_password'];
					$passwdRepeat = $data['new_password_repeat'];

					if($passwd === $passwdRepeat) {
						if(checkPasswordStrenth($passwd)) {
							$password_hash = sshaEncode($passwd);
							$entry = array('userPassword' => $password_hash);
							$return_mod = ldap_modify($ldapconn, $userdn, $entry);
							if (ldap_errno($ldapconn) === 0) {
								// password changed successfully
								$this->sendFeedback(true, {
									'info' => array(
										'display_message' => _('Password is changed successfully.')
									)
								});
							} else {
								$errorMessage = _('Password is not changed.');
							}
						} else {
							$errorMessage = _('Password is weak.');
						}
					} else {
						$errorMessage = _('New passwords does not match.');
					}
				} else {
					$errorMessage = _('Current password does not match.');
				}

				// release ldap-bind
				ldap_unbind($ldapconn);
			}
		}

		if(!empty($errorMessage)) {
			$this->sendFeedback(false, {
				'type' => 999,	// ERROR_LDAP
				'info' => array(
					'ldap_error' => ldap_errno(),
					'ldap_error_name' => ldap_error(),
					'display_message' => $errorMessage
				)
			});
		}
	}

	public function saveInDB($data)
	{
		$passwd = $data['new_password'];
		$passwdRepeat = $data['new_password_repeat'];

		$passwd_cmd = "/usr/bin/zarafa-passwd -u %s -o %s -p %s";

		if($passwd === $passwdRepeat) {
			if(checkPasswordStrenth($passwd)) {
				// all information correct, change password
				$cmd = sprintf($passwd_cmd, $data['username'], $data['current_passwd'], $passwd);
				exec($cmd, $arrayout, $retval);

				if ($retval === 0) {
					// password changed successfully
					$this->sendFeedback(true, {
						'info' => array(
							'display_message' => _('Password is changed successfully.')
						)
					});
				} else {
					$errorMessage = _('Password is not changed.');
				}   
			} else {
				$errorMessage = _('Password is weak.');
			}
		} else {
			$errorMessage = _('New passwords does not match.');
		}   
	}

	// check passwords. They should meet the following criteria:
	// - min. 8 chars, max. 20
	// - contain caps und noncaps characters
	// - contain numbers
	// return FALSE if not all criteria are met
	public function checkPasswordStrenth($password)
	{
		// @FIXME should be moved to client side
		if (preg_match("#.*^(?=.{8,20})(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).*$#", $password)) {
			return true;
		} else {
			return false;
		}
	}

	// 	create a ldap-password-hash from $text
	function sshaEncode($text)
	{
		$salt = '';
		for ($i=1; $i<=10; $i++) {
			$salt .= substr('0123456789abcdef', rand(0, 15), 1);
		}

		$hash = '{SSHA}' . base64_encode(pack("H*",sha1($text . $salt)) . $salt);

		return $hash;
	}
}
?>