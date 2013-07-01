<?php
/**
 * Passwd module.
 *
 */

class PasswdModule extends Module
{
	public function __construct($id, $data) {
		parent::Module($id, $data);
	}

	/**
	 * Process the incoming events that were fire by the client.
	 *
	 * @return boolean True if everything was processed correctly.
	 */
	public function execute()
	{
		$result = false;

		foreach($this->data as $actionType => $actionData)
		{
			if(isset($actionType)) {
				try {
					switch($actionType)
					{
						case "save":
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
}
?>