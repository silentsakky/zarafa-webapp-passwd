Ext.namespace('Zarafa.plugins.passwd');

/**
 * @class Zarafa.plugins.passwd.PasswdPanel
 * @extends Ext.form.FormPanel
 *
 * Panel which holds a form that will be used to change the password
 */
Zarafa.plugins.passwd.PasswdPanel = Ext.extend(Ext.form.FormPanel, {
	/**
	 * @property
	 * @type Ext.LoadMask
	 * Save mask that will be displayed when request has been sent to server for password change
	 * and waiting for the response.
	 */
	saveMask : undefined,

	/**
	 * @constructor
	 * @param {Object} config configuration object that needs to be used when creating this dialog
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype : 'zarafa.passwdpanel',
			labelWidth : 150,
			defaults : {
				width : 200
			},
			items : [{
				xtype : 'displayfield',
				ref : 'userNameField',
				fieldLabel : 'User name'
			}, {
				xtype : 'textfield',
				ref : 'oldPasswdField',
				fieldLabel : 'Current password',
				inputType : 'password'
			}, {
				xtype : 'textfield',
				ref : 'newPasswdField',
				fieldLabel : 'New password',
				inputType : 'password'
			}, {
				xtype : 'textfield',
				ref : 'newPasswdRepeatField',
				fieldLabel : 'Retype new password',
				inputType : 'password'
			}],
			buttons : [{
				text : 'Ok',
				handler : this.onOk,
				scope : this
			}, {
				text : 'Cancel',
				handler : this.onCancel,
				scope : this
			}]
		});

		Zarafa.plugins.passwd.PasswdPanel.superclass.constructor.apply(this, arguments);

		this.on('afterrender', this.initialize, this);
	},

	/**
	 * Function will initialize this dialog with some default values and will
	 * also create object of {@link #saveMask}.
	 */
	initialize : function()
	{
		this.userNameField.setValue(container.getUser().getUserName());

		this.saveMask = new Ext.LoadMask(this.getEl(), {
			msg : _('Saving please wait ...')
		})
	},

	/**
	 * Handler function that will be called when user presses ok button
	 * to change password.
	 */
	onOk : function()
	{
		// show load mask
		this.saveMask.show();

		// send request
		container.getRequest().singleRequest('passwdmodule', 'save', {
			username : this.userNameField.getValue(),
			current_password : this.oldPasswdField.getValue(),
			new_password : this.newPasswdField.getValue(),
			new_password_repeat : this.newPasswdRepeatField.getValue()			
		}, new Zarafa.plugins.passwd.data.PasswdResponseHandler({
			callbackFn : this.callbackFn,
			scope : this
		}));
	},

	/**
	 * Handler function that will be called when user presses cancel button
	 * to close the dialog.
	 */
	onCancel : function()
	{
		// close the dialog
		this.dialog.close();
	},

	/**
	 * Callback function that will be executed after response is received from server.
	 * @param {Boolean} success boolean to indicate response contains success/failure data.
	 * @param {Object} response response sent by server.
	 */
	callbackFn : function(success, response)
	{
		// hide load mask
		this.saveMask.hide();

		// close the dialog
		if(success) {
			this.dialog.close();
		}
	}
});

Ext.reg('zarafa.passwdpanel', Zarafa.plugins.passwd.PasswdPanel);