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
		// open a dialog
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
