Ext.namespace('Zarafa.plugins.passwd.settings');

/**
 * @class Zarafa.plugins.passwd.settings.SettingsPasswdWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 * @xtype zarafa.settingspasswdwidget
 *
 * The {@link Zarafa.settings.ui.SettingsWidget widget} for changing password
 * in the {@link Zarafa.plugins.passwd.settings.SettingsPasswdCategory password category}.
 */
Zarafa.plugins.passwd.settings.SettingsPasswdWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			height : 175,
			width : 400,
			title : _('Change Password'),
			xtype : 'zarafa.settingspasswdwidget',
			layout : {
				// override from SettingsWidget
				type : 'fit'
			},
			items : [{
				xtype : 'zarafa.passwdpanel',
				ref : 'passwdPanel',
				listeners : {
					userchange : this.setModelDirty,
					beforesave : this.onBeforeSave,

					scope : this
				}
			}]
		});

		Zarafa.plugins.passwd.settings.SettingsPasswdWidget.superclass.constructor.call(this, config);
	},

	/**
	 * initialize events for the {@link Zarafa.plugins.passwd.settings.SettingsPasswdWidget SettingsPasswdWidget}.
	 * @private
	 */
	initEvents : function()
	{
		Zarafa.plugins.passwd.settings.SettingsPasswdWidget.superclass.initEvents.call(this);

		// listen to savesettings and discardsettings to save/discard delegation data
		var contextModel = this.settingsContext.getModel();

		this.mon(contextModel, 'savesettings', this.onSaveSettings, this);
		this.mon(contextModel, 'discardsettings', this.onDiscardSettings, this);
	},

	/**
	 * Event handler will be called when {@link Zarafa.settings.SettingsContextModel#savesettings} event is fired.
	 * This will relay this event to {@link Zarafa.plugins.passwd.settings.PasswdPanel PasswdPanel} so it can
	 * save data.
	 * @private
	 */
	onSaveSettings : function()
	{
		// only save when this category is visible on screen
		if(this.ownerCt.isVisible()) {
			this.passwdPanel.saveChanges();
		}
	},

	/**
	 * Event handler will be called when {@link Zarafa.settings.SettingsContextModel#discardsettings} event is fired.
	 * This will relay this event to {@link Zarafa.plugins.passwd.settings.PasswdPanel PasswdPanel} so it can
	 * discard current changes.
	 * @private
	 */
	onDiscardSettings : function()
	{
		this.passwdPanel.discardChanges();
	},

	/**
	 * Function will be called when any field in {@link Zarafa.plugins.passwd.settings.PasswdPanel}
	 * is changed and we need to mark settings model as dirty.
	 * @private
	 */
	setModelDirty : function()
	{
		var model = this.settingsContext.getModel();

		if(!model.hasChanges()) {
			model.setDirty();
		}
	}
});

Ext.reg('zarafa.settingspasswdwidget', Zarafa.plugins.passwd.settings.SettingsPasswdWidget);
