Ext.namespace('Zarafa.plugins.passwd');

/**
 * @class Zarafa.plugins.passwd.PasswdPlugin
 * @extends Zarafa.core.Plugin
 *
 * Passwd plugin.
 * Allows users to change password from webapp.
 */
Zarafa.plugins.passwd.PasswdPlugin = Ext.extend(Zarafa.core.Plugin, {

	/**
	 * Initialize the plugin by registering to the insertion point
	 * to add something to the right end of the main tab bar.
	 * @protected
	 */
	initPlugin : function()
	{
		Zarafa.plugins.passwd.PasswdPlugin.superclass.initPlugin.apply(this, arguments);

		this.registerInsertionPoint('main.maintabbar.right', this.putTabbarButton, this);

		// Register common specific dialog types
		Zarafa.core.data.SharedComponentType.addProperty('plugins.passwd.passwdpanel');
	},

	/**
	 * Bid for the type of shared component and the given record.
	 * @param {Zarafa.core.data.SharedComponentType} type Type of component a context can bid for.
	 * @param {Ext.data.Record} record Optionally passed record.
	 * @return {Number} The bid for the shared component
	 */
	bidSharedComponent: function(type, record)
	{
		var bid = -1;

		switch (type) {
			// Bid for password dialog
			case Zarafa.core.data.SharedComponentType['plugins.passwd.passwdpanel']:
				bid = 1;
				break;
		}

		return bid;
	},

	/**
	 * Will return the reference to the shared component.
	 * Based on the type of component requested a component is returned.
	 * @param {Zarafa.core.data.SharedComponentType} type Type of component a context can bid for.
	 * @param {Ext.data.Record} record Optionally passed record.
	 * @return {Ext.Component} Component
	 */
	getSharedComponent: function(type, record)
	{
		var component;

		switch (type) {
			case Zarafa.core.data.SharedComponentType['plugins.passwd.passwdpanel']:
				component = Zarafa.plugins.passwd.PasswdContentPanel;
				break;
		}

		return component;
	},

	/**
	 * Create the button to add to the insertion point as called
	 * by init().
	 * @return A struct with the necessary configuration for the button.
	 * @private
	 */
	putTabbarButton : function()
	{
		return {
			text : _('Change Password'),
			handler : this.clickPasswdButton
		};
	},

	/**
	 * Trigger function called when the user clicks the button in the
	 * main tab bar.
	 * @private
	 */
	clickPasswdButton : function()
	{
		var componentType = Zarafa.core.data.SharedComponentType['plugins.passwd.passwdpanel'];
		Zarafa.core.data.UIFactory.openLayerComponent(componentType, undefined, {
			modal : true
		});
	}
});

Zarafa.onReady(function() {
	container.registerPlugin(new Zarafa.core.PluginMetaData({
		name : 'passwd',
		displayName : _('Password Change Plugin'),
		about : Zarafa.plugins.passwd.ABOUT,
		pluginConstructor : Zarafa.plugins.passwd.PasswdPlugin
	}));
});
