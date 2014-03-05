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
			labelWidth : 200,
			defaults : {
				width : 200
			},
			border : false,
			items : [{
				xtype : 'displayfield',
				name : 'username',
				fieldLabel : dgettext("plugin_passwd", 'User name')
			}, {
				xtype : 'textfield',
				name : 'current_password',
				fieldLabel : dgettext("plugin_passwd", 'Current password'),
				inputType : 'password',
				listeners : {
					change : this.onFieldChange,
					scope : this
				}
			}, {
				xtype : 'textfield',
				name : 'new_password',
				fieldLabel : dgettext("plugin_passwd", 'New password'),
				inputType : 'password',
				listeners : {
					change : this.onFieldChange,
					scope : this
				}
			}, {
				xtype : 'textfield',
				name : 'new_password_repeat',
				fieldLabel : dgettext("plugin_passwd", 'Retype new password'),
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
			'userchange'
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
	}
});

Ext.reg('zarafa.passwdpanel', Zarafa.plugins.passwd.settings.PasswdPanel);
