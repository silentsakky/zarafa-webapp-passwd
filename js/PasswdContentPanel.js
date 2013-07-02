Ext.namespace('Zarafa.plugins.passwd');

/**
 * @class Zarafa.plugins.passwd.PasswdContentPanel
 * @extends Zarafa.core.ui.ContentPanel
 *
 * Content panel that will layout the container
 */
Zarafa.plugins.passwd.PasswdContentPanel = Ext.extend(Zarafa.core.ui.ContentPanel, {

	/**
	 * @constructor
	 * @param {Object} config configuration object that needs to be used when creating this dialog
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype : 'zarafa.passwdcontentpanel',
			layout : 'fit',
			height : 175,
			width : 400,
			title : _('Change password'),
			items : [{
				xtype : 'zarafa.passwdpanel'
			}]
		});

		Zarafa.plugins.passwd.PasswdContentPanel.superclass.constructor.apply(this, arguments);
	}
});

Ext.reg('zarafa.passwdcontentpanel', Zarafa.plugins.passwd.PasswdContentPanel);