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
			$errorMessage = _('No data received.');
		}

		if(empty($data['username'])) {
			$errorMessage = _('User name is empty.');
		}

		if(empty($data['current_password'])) {
			$errorMessage = _('Current password is empty.');
		}

		if(empty($data['new_password']) || empty($data['new_password_repeat'])) {
			$errorMessage = _('New password is empty.');
		}

		if($data['new_password'] !== $data['new_password_repeat']) {
			$errorMessage = _('New passwords does not match.');
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

		// connect to LDAP server
		$ldapconn = ldap_connect(PLUGIN_PASSWD_LDAP_URI);

		// check connection is successfull
		if(ldap_errno($ldapconn) === 0) {
			// get the users uid, if we have a multi tenant installation then remove company name from user name
			$parts = explode('@', $data['username']);
			$uid = $parts[0];

			// search for the user dn that will be used to do login into LDAP
			$userdn = ldap_search (
				$ldapconn,						// connection-identify
				PLUGIN_PASSWD_LDAP_BASEDN,		// basedn
				'uid=' . $uid,		// search filter
				array('dn')						// needed attributes. we need the dn
			);

			if ($userdn) {
				$userdn = ldap_get_entries($ldapconn, $userdn);
				$userdn = $userdn[0]['dn'];

				// bind to ldap directory
				ldap_set_option($ldapconn, LDAP_OPT_PROTOCOL_VERSION, 3);

				// login with current password if that fails then current password is wrong
				$bind = ldap_bind($ladpconn, $userdn, $data['current_password']);

				if(ldap_errno($ldapconn) === 0) {
					$passwd = $data['new_password'];
					$passwdRepeat = $data['new_password_repeat'];

					if($this->checkPasswordStrenth($passwd)) {
						$password_hash = $this->sshaEncode($passwd);
						$entry = array('userPassword' => $password_hash);
						$return_mod = ldap_modify($ldapconn, $userdn, $entry);
						if (ldap_errno($ldapconn) === 0) {
							// password changed successfully

							// write new password to session because we don't want user to re-authenticate
							session_start();
							$_SESSION['password'] = $passwd;
							session_write_close();

							// send feedback to client
							$this->sendFeedback(true, array(
								'info' => array(
									'display_message' => _('Password is changed successfully.')
								)
							));
						} else {
							$errorMessage = _('Password is not changed.');
						}
					} else {
						$errorMessage = _('Password is weak. Password should contain capital, non capital letters and numbers. Password shuold have 8 to 20 characters.');
					}
				} else {
					$errorMessage = _('Current password does not match.');
				}

				// release ldap-bind
				ldap_unbind($ldapconn);
			}
		}

		if(!empty($errorMessage)) {
			$this->sendFeedback(false, array(
				'type' => ERROR_ZARAFA,
				'info' => array(
					'ldap_error' => ldap_errno(),
					'ldap_error_name' => ldap_error(),
					'display_message' => $errorMessage
				)
			));
		}
	}

	/**
	 * Function will execute zarafa-passwd command and will try to change user's password,
	 * this method is unsecure and unreliable.
	 * @param {Array} $data data sent by client.
	 */
	public function saveInDB($data)
	{
		$errorMessage = '';
		$passwd = $data['new_password'];
		$passwdRepeat = $data['new_password_repeat'];

		if($this->checkPasswordStrenth($passwd)) {
			$passwd_cmd = '/usr/bin/zarafa-passwd -u %s -o %s -p %s';

			// all information correct, change password
			$cmd = sprintf($passwd_cmd, $data['username'], $data['current_password'], $passwd);
			exec($cmd, $arrayout, $retval);

			if ($retval === 0) {
				// password changed successfully

				// write new password to session because we don't want user to re-authenticate
				session_start();
				$_SESSION['password'] = $passwd;
				session_write_close();

				// send feedback to client
				$this->sendFeedback(true, array(
					'info' => array(
						'display_message' => _('Password is changed successfully.')
					)
				));
			} else {
				$errorMessage = _('Password is not changed.');
			}
		} else {
			$errorMessage = _('Password is weak. Password should contain capital, non capital letters and numbers. Password shuold have 8 to 20 characters.');
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
	 * Function will check strength of the password and if it does not meet minimum requirements then
	 * will return false.
	 * Password should meet the following criteria:
	 * - min. 8 chars, max. 20
	 * - contain caps and noncaps characters
	 * - contain numbers
	 * @param {String} $password password which should be checked.
	 * @return {Boolean} true if password passes the minimum requirement else false.
	 */
	public function checkPasswordStrenth($password)
	{
		// @FIXME should be moved to client side
		if (preg_match("#.*^(?=.{8,20})(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).*$#", $password)) {
			return true;
		} else {
			return false;
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