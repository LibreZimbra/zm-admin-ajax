/*
 * ***** BEGIN LICENSE BLOCK *****
 * Zimbra Collaboration Suite Web Client
 * Copyright (C) 2005, 2006, 2007, 2008, 2009, 2010 Zimbra, Inc.
 * 
 * The contents of this file are subject to the Zimbra Public License
 * Version 1.3 ("License"); you may not use this file except in
 * compliance with the License.  You may obtain a copy of the License at
 * http://www.zimbra.com/license.
 * 
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied.
 * ***** END LICENSE BLOCK *****
 */

/**
 * @overview
 * 
 * This file defines a label.
 *
 */

/**
 * @class
 * This class represents a label, which consists of an image and/or text. It is used
 * both as a concrete class and as the base class for {@link DwtButton}. The label
 * components are managed within a table. The label can be enabled or disabled, which are reflected in 
 * its display. A disabled label looks greyed out.
 * 
 * <h4>CSS</h4>
 * <ul>
 * <li><i>.className</i> table - the label table</li>
 * <li><i>.className</i> .Icon - class name for the icon image cell</li>
 * <li><i>.className</i> .Text - enabled text cell</li>
 * <li><i>.className</i> .DisabledText - disabled text cell</li>
 * </ul>
 * 
 * <h4>Keyboard Actions</h4>
 * None
 * 
 * <h4>Events</h4>
 * None
 * 
 * @author Ross Dargahi
 * 
 * @param {Hash}		params		the hash of parameters:
 * <ul>
 * <li>parent	{@link DwtComposite} 		the parent widget</li>
 * <li>style			{constant}			label style: May be one of: {@link DwtLabel.IMAGE_LEFT} 
 * 											or {@link DwtLabel.IMAGE_RIGHT} arithmetically or'd (|) with  one of:
 * 											{@link DwtLabel.ALIGN_LEFT}, {@link DwtLabel.ALIGN_CENTER}, or {@link DwtLabel.ALIGN_LEFT}
 * 											The first determines were in the label the icon will appear (if one is set), the second
 * 											determine how the content of the label will be aligned. The default value for
 * 											this parameter is: {@link DwtLabel.IMAGE_LEFT} | {@link DwtLabel.ALIGN_CENTER}</li>
 * <li>className		{String}			the CSS class</li>
 * <li>posStyle		{constant}			the positioning style</li>
 * <li>id			{String}			the to use for the control HTML element</li>
 * <li>index 		{int}				the index at which to add this control among parent's children</li>
 * </ul>
 *        
 * @extends DwtControl
 */
DwtLabel = function(params) {
	if (arguments.length == 0) { return; }
	params = Dwt.getParams(arguments, DwtLabel.PARAMS);
	
	params.className = params.className || "DwtLabel";
	DwtControl.call(this, params);

	/**The label's style. See the constructor documentation for more info
	 * @type Int*/
	this._style = params.style || (DwtLabel.IMAGE_LEFT | DwtLabel.ALIGN_CENTER);
	
	/**The label text's background color
	 * @type String*/
	this._textBackground = null;
	
	/**The label text's foreground color
	 * @type String*/
	this._textForeground = null;

    this._createHtml();
    //MOW:  this.setCursor("default");
}

DwtLabel.PARAMS = ["parent", "style", "className", "posStyle", "id", "index"];

DwtLabel.prototype = new DwtControl;
DwtLabel.prototype.constructor = DwtLabel;

/**
 * Returns a string representation of the object.
 * 
 * @return		{String}		a string representation of the object
 */
DwtLabel.prototype.toString =
function() {
	return "DwtLabel";
}

//
// Constants
//

// display styles
/**
 * Defines the "left" align image (i.e. align to the left of text, if both present).
 * 
 * @type {int}
 */
DwtLabel.IMAGE_LEFT = 1;

/**
 * Defines the "right" align image (i.e. align to the right of text, if both present).
 * 
 * @type {int}
 */
DwtLabel.IMAGE_RIGHT = 2;

/**
 * Defines the "left" align label.
 * 
 * @type {int}
 */
DwtLabel.ALIGN_LEFT = 4;

/**
 * Defines the "right" align label.
 * 
 * @type {int}
 */
DwtLabel.ALIGN_RIGHT = 8;

/**
 * Defines the "center" align label.
 * 
 * @type {int}
 */
DwtLabel.ALIGN_CENTER = 16;

/**
 * Defines the last style label (used for subclasses).
 * 
 * @type {int}
 */
DwtLabel._LAST_STYLE = 16;

//
// Data
//

DwtLabel.prototype.TEMPLATE = "dwt.Widgets#ZLabel";

//
// Public methods
//

/**
 * Disposes of the label.
 * 
 */
DwtLabel.prototype.dispose =
function() {
	delete this._dropDownEl;
	delete this._iconEl;
	delete this._textEl;
	DwtControl.prototype.dispose.call(this);
};

/**
 * Sets the enabled/disabled state of the label. A disabled label may have a different
 * image, and greyed out text. This method overrides {@link DwtControl#setEnabled}.
 *
 * @param {Boolean} enabled 		<code>true</code> to set the label as enabled
 */
DwtLabel.prototype.setEnabled =
function(enabled) {
	if (enabled != this._enabled) {
		DwtControl.prototype.setEnabled.call(this, enabled);
		this.__setImage(this.__imageInfo);
	}
}

/**
 * Gets the current image info.
 * 
 * @return	{String}	the image info
 */
DwtLabel.prototype.getImage =
function() {
	return this.__imageInfo;
}

/**
 * Sets the main (enabled) image. If the label is currently enabled, the image is updated.
 * 
 * @param	{String}	imageInfo		the image
 */
DwtLabel.prototype.setImage =
function(imageInfo) {
	this.__imageInfo = imageInfo;
	this.__setImage(imageInfo);
}

/**
 * Sets the disabled image. If the label is currently disabled, its image is updated.
 *
 * @param	{String}	imageInfo		the image
 * @deprecated		no longer support different images for disabled
 * @see		#setImage
 */
DwtLabel.prototype.setDisabledImage =
function(imageInfo) {
	// DEPRECATED -- we no longer support different images for disabled.
	//	See __setImage() for details.
}

/**
 * Gets the label text.
 * 
 * @retur	{String}	the text or <code>null</code> if not set
 */
DwtLabel.prototype.getText =
function() {
	return (this.__text != null) ? this.__text : null;
}

/**
* Sets the label text, and manages the placement and display.
*
* @param {String}	text	the new label text
*/
DwtLabel.prototype.setText =
function(text) {
    if (!this._textEl) return;

    if (text == null || text == "") {
        this.__text = null;
        this._textEl.innerHTML = "";
    }
    else {
		this.__text = text;
        this._textEl.innerHTML = text;
    }
}

/**
 * Sets the text background.
 * 
 * @param	{String}	color	the background color
 */
DwtLabel.prototype.setTextBackground =
function(color) {
	this._textBackground = color;
    if (this._textEl) {
        this._textEl.style.backgroundColor = color;
    }
}

/**
 * Sets the text foreground.
 * 
 * @param	{String}	color	the foreground color
 */
DwtLabel.prototype.setTextForeground =
function(color) {
	this._textForeground = color;
    if (this._textEl) {
		this._textEl.style.color = color;
    }
}

/**
 * Sets the align style.
 * 
 * @param		{constant}		alignStyle		the align style
 */
DwtLabel.prototype.setAlign =
function(alignStyle) {
	this._style = alignStyle;

	// reset dom since alignment style may have changed
    this.__setImage(this.__imageInfo);
}

/**
 * Checks if the given style is set as the current label style.
 * 
 * @param	{constant}	style	the style
 * @return	{Boolean}	<code>true</code> if the style is set
 */
DwtLabel.prototype.isStyle = function(style) {
    return this._style & style;
};

//
// Protected methods
//

/**
 * @private
 */
DwtLabel.prototype._createHtml = function(templateId) {
    var data = { id: this._htmlElId };
    this._createHtmlFromTemplate(templateId || this.TEMPLATE, data);
};

/**
 * @private
 */
DwtLabel.prototype._createHtmlFromTemplate = function(templateId, data) {
    DwtControl.prototype._createHtmlFromTemplate.call(this, templateId, data);
    this._textEl = document.getElementById(data.id+"_title");
};

/**
 * @private
 */
DwtLabel.prototype._getIconEl = function() {
	// MOW: getting the proper icon element on demand rather than all the time for speed
	var direction = (this._style & DwtLabel.IMAGE_RIGHT ? "right" : "left");
	return this._iconEl || 
			(this._iconEl = document.getElementById(this._htmlElId+"_"+direction+"_icon"));
}

//
// Private methods
//

/**
 * Set the label's image, and manage its placement.
 *
 * @private
 */
DwtLabel.prototype.__setImage =
function(imageInfo) {


	var iconEl = this._getIconEl();
	if (iconEl) {
		if (imageInfo) {
			AjxImg.setImage(iconEl, imageInfo, null, !this._enabled);

			// set a ZHasRightIcon or ZHasLeftIcon on the outer element, depending on which we set
			var elementClass = (this._style & DwtLabel.IMAGE_RIGHT ? "ZHasRightIcon" : "ZHasLeftIcon");
			Dwt.addClass(this.getHtmlElement(), elementClass);
		} else {
			iconEl.innerHTML = "";
		}
	}
};
