Ext.namespace('Zarafa.plugins.passwd.settings');

/**
 * @class Zarafa.plugins.passwd.settings.SettingsPasswdCategory
 * @extends Zarafa.settings.ui.SettingsCategory
 * @xtype zarafa.settingspasswdcategory
 *
 * The passwd settings category that will allow users to change their passwords
 */
Zarafa.plugins.passwd.settings.SettingsPasswdCategory = Ext.extend(Zarafa.settings.ui.SettingsCategory, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title : _('Change Password'),
			categoryIndex : 9997,
			xtype : 'zarafa.settingspasswdcategory',
			items : [{
				xtype : 'zarafa.settingspasswdwidget',
				settingsContext : config.settingsContext
			}]
		});

		Zarafa.plugins.passwd.settings.SettingsPasswdCategory.superclass.constructor.call(this, config);
	},

	/**
	 * Called by superclass when the Category has been deselected and is hidden from the user,
	 * this will unregister the {@link #onBeforeSaveRules} event handler.
	 * @private
	 */
	onHide : function()
	{
		Zarafa.common.settings.SettingsRuleCategory.superclass.onHide.apply(this, arguments);

		// Unregister the 'beforesave' event. This could be lingering when
		// 'savesettings' was fired but it was cancelled by one of the
		// event handlers.
		var panel = this.get(0).passwdPanel;
		this.mun(panel, 'beforesave', this.onBeforeSavePasswd, this);
	},

	/**
	 * Event handler for the
	 * {@link Zarafa.settings.SettingsContextModel ContextModel}#{@link Zarafa.settings.SettingsContextModel#beforesavesettings beforesavesettings}
	 * event. It will reset the {@link #savingElCounter} and his will register the event handler for
	 * {@link Zarafa.settings.SettingsModel#beforesave beforesave} event.
	 * @private
	 */
	onBeforeSaveSettingsModel : function()
	{
		Zarafa.common.settings.SettingsRuleCategory.superclass.onBeforeSaveSettingsModel.apply(this, arguments);

		var panel = this.get(0).passwdPanel;
		this.mon(panel, 'beforesave', this.onBeforeSavePasswd, this, { single : true });
	},

	/**
	 * Event handler which is fired when the {@link Zarafa.plugins.passwd.settings.PasswdPanel Passwd Panel}
	 * fires the 'beforesave' event. This will {@link #displaySavingMask show a notification} and register the
	 * event handlers for the completion of the save.
	 * @private
	 */
	onBeforeSavePasswd : function()
	{
		this.displaySavingMask();

		var panel = this.get(0).passwdPanel;
		this.mon(panel, 'save', this.onPasswdSave, this);
		this.mon(panel, 'exception', this.onPasswdException, this);
	},

	/**
	 * Event handler which is fired when the {@link Zarafa.common.rules.data.RulesStore Rules Store}
	 * fires the 'save' event indicating the successfull save of the rules. This will
	 * {@link #hideSavingMask hide the notification}.
	 * @private
	 */
	onPasswdSave : function()
	{
		this.hideSavingMask(true);

		var panel = this.get(0).passwdPanel;
		this.mun(panel, 'save', this.onPasswdSave, this);
		this.mun(panel, 'exception', this.onPasswdException, this);
	},

	/**
	 * Event handler which is fired when the {@link Zarafa.common.rules.data.RulesStore Rules Store}
	 * fires the 'exception' event indicating a failing save of the rules. This will
	 * {@link #hideSavingMask hide the notification}.
	 * @private
	 */
	onPasswdException : function()
	{
		this.hideSavingMask(false);

		var panel = this.get(0).passwdPanel;
		this.mun(panel, 'save', this.onPasswdSave, this);
		this.mun(panel, 'exception', this.onPasswdException, this);
	}
});

Ext.reg('zarafa.settingspasswdcategory', Zarafa.plugins.passwd.settings.SettingsPasswdCategory);
