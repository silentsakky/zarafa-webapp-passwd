Ext.namespace('Zarafa.plugins.passwd.settings');

/**
 * @class Zarafa.plugins.passwd.settings.PasswdPanel
 * @extends Ext.form.FormPanel
 *
 * Panel which holds a form that will be used to change the password
 */
Zarafa.plugins.passwd.settings.PasswdPanel = Ext.extend(Ext.form.FormPanel, {

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
			border : false,
			items : [{
				xtype : 'displayfield',
				name : 'username',
				fieldLabel : 'User name'
			}, {
				xtype : 'textfield',
				name : 'current_password',
				fieldLabel : 'Current password',
				inputType : 'password',
				listeners : {
					change : this.onFieldChange,
					scope : this
				}
			}, {
				xtype : 'textfield',
				name : 'new_password',
				fieldLabel : 'New password',
				inputType : 'password',
				listeners : {
					change : this.onFieldChange,
					scope : this
				}
			}, {
				xtype : 'textfield',
				name : 'new_password_repeat',
				fieldLabel : 'Retype new password',
				inputType : 'password',
				listeners : {
					change : this.onFieldChange,
					scope : this
				}
			}]
		});

		this.addEvents(
			/**
			 * @event userchange
			 * Fires when a field is modified in the form panel
			 */
			'userchange',
			/**
			 * @event beforesave
			 * Fires when this form panel about to send request to server
			 */
			'beforesave',
			/**
			 * @event save
			 * Fires when this form panel has successfully changed password
			 */
			'save',
			/**
			 * @event exception
			 * Fires when this form panel was not able to change password
			 */
			'exception'
		);

		Zarafa.plugins.passwd.settings.PasswdPanel.superclass.constructor.apply(this, arguments);

		this.on('afterrender', this.initialize, this);
	},

	/**
	 * Function will initialize this dialog with some default values and will
	 * also create object of {@link #saveMask}.
	 */
	initialize : function()
	{
		this.getForm().setValues({
			username : container.getUser().getUserName()
		});
	},

	/**
	 * Handler function will be called when user changes any field in the form.
	 * This will fire custom event on this form to indicate that settings model
	 * should be marked as dirty
	 */
	onFieldChange : function(field, newValue, oldValue)
	{
		this.fireEvent('userchange', this);
	},

	/**
	 * Function will be called when user presses apply to change password.
	 */
	saveChanges : function()
	{
		this.fireEvent('beforesave', this);

		var data = this.getForm().getFieldValues();

		// send request
		container.getRequest().singleRequest('passwdmodule', 'save', data, new Zarafa.plugins.passwd.data.PasswdResponseHandler({
			callbackFn : this.callbackFn,
			scope : this
		}));
	},

	/**
	 * Function will be called when user presses discard button to reset
	 * fields.
	 */
	discardChanges : function()
	{
		// reset user changes
		this.getForm().reset();
	},

	/**
	 * Callback function that will be executed after response is received from server.
	 * @param {Boolean} success boolean to indicate response contains success/failure data.
	 * @param {Object} response response sent by server.
	 */
	callbackFn : function(success, response)
	{
		if(success) {
			this.fireEvent('save', this);
		} else {
			this.fireEvent('exception', this);
		}
	}
});

Ext.reg('zarafa.passwdpanel', Zarafa.plugins.passwd.settings.PasswdPanel);