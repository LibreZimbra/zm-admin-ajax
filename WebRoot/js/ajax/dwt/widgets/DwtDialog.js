/*
 * ***** BEGIN LICENSE BLOCK *****
 * Zimbra Collaboration Suite Web Client
 * Copyright (C) 2005, 2006, 2007, 2008 Zimbra, Inc.
 * 
 * The contents of this file are subject to the Yahoo! Public License
 * Version 1.0 ("License"); you may not use this file except in
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
 * This file contains classes for a Dwt dialog pop-up.
 */

/**
 * @class
 * This class represents a popup dialog with a title and standard buttons.
 * A client or subclass sets the dialog content. Dialogs always hang-off the main shell
 * since their stacking order is managed through z-index.
 *
 * @author Ross Dargahi
 * @author Conrad Damon
 *
 * @param {Hash}		params			a hash of parameters
 * <ul>
 * <li>parent			{DwtComposite} 		the parent widget (the shell)</li>
 * <li>className		{String}			the CSS class</li>
 * <li>title			{String}			the title of dialog</li>
 * <li>standardButtons	{Array|constant}	an array of standard buttons to include. Defaults to {@link DwtDialog.OK_BUTTON} and {@link DwtDialog.CANCEL_BUTTON}.</li>
 * <li>extraButtons		{Array}  			a list of {@link DwtDialog_ButtonDescriptor} objects describing custom buttons to add to the dialog</li>
 * <li>zIndex			{int}				the z-index to set for this dialog when it is visible. Defaults to <i>Dwt.Z_DIALOG</i>.</li>
 * <li>mode 			{@link DwtDialog.MODELESS}|{@link DwtDialog.MODAL}			the modality of the dialog. Defaults to {@link DwtDialog.MODAL}.</li> 
 * <li>loc				{DwtPoint}			the location at which to popup the dialog. Defaults to centered within its parent.</li>
 * </ul>
 * 
 * @see		#.CANCEL_BUTTON
 * @see		#.OK_BUTTON
 * @see		#.DISMISS_BUTTON
 * @see		#.NO_BUTTON
 * @see		#.YES_BUTTON
 * @see		#.ALL_BUTTONS
 * @see		#.NO_BUTTONS
 * 
 * @extends	DwtBaseDialog
 */
DwtDialog = function(params) {
	if (arguments.length == 0) { return; }
	params = Dwt.getParams(arguments, DwtDialog.PARAMS);
	params.className = params.className || "DwtDialog";
	this._title = params.title = params.title || "";

	// standard buttons default to OK / Cancel
	var standardButtons = params.standardButtons;
	var extraButtons = params.extraButtons;
	if (!standardButtons) {
		standardButtons = [DwtDialog.OK_BUTTON, DwtDialog.CANCEL_BUTTON];
	} else if (standardButtons == DwtDialog.NO_BUTTONS) {
		standardButtons = null;
	} else if (standardButtons && !standardButtons.length) {
		standardButtons = [standardButtons];
	}
	
	// assemble the list of button IDs, and the list of button descriptors
	this._buttonList = [];
	var buttonOrder = {};
	buttonOrder[DwtDialog.ALIGN_LEFT] = [];
	buttonOrder[DwtDialog.ALIGN_CENTER] = [];
	buttonOrder[DwtDialog.ALIGN_RIGHT] = [];
	if (standardButtons || extraButtons) {
		this._buttonDesc = {};
		if (standardButtons && standardButtons.length) {
			this._initialEnterButtonId = this._enterButtonId = standardButtons[0];
			for (var i = 0; i < standardButtons.length; i++) {
				var buttonId = standardButtons[i];
				this._buttonList.push(buttonId);
				var align = DwtDialog.ALIGN[buttonId];
				if (align) {
					buttonOrder[align].push(buttonId);
				}
				// creating standard button descriptors on file read didn't work, so we create them here
				this._buttonDesc[buttonId] = new DwtDialog_ButtonDescriptor(buttonId, AjxMsg[DwtDialog.MSG_KEY[buttonId]], align);
			}
			// set standard callbacks
			this._resetCallbacks();
		}
		if (extraButtons && extraButtons.length) {
			if (!this._enterButtonId) {
				this._initialEnterButtonId = this._enterButtonId = extraButtons[0];
			}
			for (var i = 0; i < extraButtons.length; i++) {
				var buttonId = extraButtons[i].id;
				this._buttonList.push(buttonId);
				var align = extraButtons[i].align;
				if (align) {
					buttonOrder[align].push(buttonId);
				}
				this._buttonDesc[buttonId] = extraButtons[i];
			}
		}
	}

	// get button IDs
	this._buttonElementId = {};
	for (var i = 0; i < this._buttonList.length; i++) {
		this._buttonElementId[this._buttonList[i]] = Dwt.getNextId();
	}

	DwtBaseDialog.call(this, params);

	// set up buttons
	this._button = {};
	for (var i = 0; i < this._buttonList.length; i++) {
		var buttonId = this._buttonList[i];
		var b = this._button[buttonId] = new DwtButton({parent:this});
		b.setText(this._buttonDesc[buttonId].label);
		b.buttonId = buttonId;
		b.addSelectionListener(new AjxListener(this, this._buttonListener));
		var el = document.getElementById(this._buttonElementId[buttonId]);
		if (el) {
			el.appendChild(b.getHtmlElement());
		}
	}
	// add to tab group, in order
	var list = buttonOrder[DwtDialog.ALIGN_LEFT].concat(buttonOrder[DwtDialog.ALIGN_CENTER], buttonOrder[DwtDialog.ALIGN_RIGHT]);
	for (var i = 0; i < list.length; i++) {
		var button = this._button[list[i]];
		this._tabGroup.addMember(button);		
	}
};

DwtDialog.PARAMS = ["parent", "className", "title", "standardButtons", "extraButtons", "zIndex", "mode", "loc"];

DwtDialog.prototype = new DwtBaseDialog;
DwtDialog.prototype.constructor = DwtDialog;

/**
 * Returns a string representation of the object.
 * 
 * @return		{String}		a string representation of the object
 */
DwtDialog.prototype.toString = function() {
	return "DwtDialog";
};

//
// Constants
//

/**
 * Defines the "left" align.
 * 
 * @type {Number}
 */
DwtDialog.ALIGN_LEFT 		= 1;
/**
 * Defines the "right" align.
 * 
 * @type {Number}
 */
DwtDialog.ALIGN_RIGHT 		= 2;
/**
 * Defines the "center" align.
 * 
 * @type {Number}
 */
DwtDialog.ALIGN_CENTER 		= 3;

// standard buttons, their labels, and their positioning

/**
 * Defines the "Cancel" button.
 * 
 * @type {Number}
 */
DwtDialog.CANCEL_BUTTON 	= 1;
/**
 * Defines the "OK" button.
 * 
 * @type {Number}
 */
DwtDialog.OK_BUTTON 		= 2;
/**
 * Defines the "Dismiss" button.
 * 
 * @type {Number}
 */
DwtDialog.DISMISS_BUTTON 	= 3;
/**
 * Defines the "No" button.
 * 
 * @type {Number}
 */
DwtDialog.NO_BUTTON 		= 4;
/**
 * Defines the "Yes" button.
 * 
 * @type {Number}
 */
DwtDialog.YES_BUTTON 		= 5;

DwtDialog.LAST_BUTTON 		= 5;

/**
 * Defines "no" buttons. This constant is used to show no buttons.
 * 
 * @type {Number}
 */
DwtDialog.NO_BUTTONS 		= 256;
/**
 * Defines "all" buttons. This constant is used to show all buttons.
 * 
 * @type {Number}
 */
DwtDialog.ALL_BUTTONS 		= [DwtDialog.CANCEL_BUTTON, DwtDialog.OK_BUTTON, 
							   DwtDialog.DISMISS_BUTTON, DwtDialog.NO_BUTTON, 
							   DwtDialog.YES_BUTTON];

DwtDialog.MSG_KEY = {};
DwtDialog.MSG_KEY[DwtDialog.CANCEL_BUTTON] 	= "cancel";
DwtDialog.MSG_KEY[DwtDialog.OK_BUTTON] 		= "ok";
DwtDialog.MSG_KEY[DwtDialog.DISMISS_BUTTON] = "dismiss";
DwtDialog.MSG_KEY[DwtDialog.NO_BUTTON] 		= "no";
DwtDialog.MSG_KEY[DwtDialog.YES_BUTTON] 	= "yes";

DwtDialog.ALIGN = {};
DwtDialog.ALIGN[DwtDialog.CANCEL_BUTTON]	= DwtDialog.ALIGN_RIGHT;
DwtDialog.ALIGN[DwtDialog.OK_BUTTON] 		= DwtDialog.ALIGN_RIGHT;
DwtDialog.ALIGN[DwtDialog.DISMISS_BUTTON] 	= DwtDialog.ALIGN_RIGHT;
DwtDialog.ALIGN[DwtDialog.NO_BUTTON] 		= DwtDialog.ALIGN_RIGHT;
DwtDialog.ALIGN[DwtDialog.YES_BUTTON] 		= DwtDialog.ALIGN_RIGHT;

/**
 * Defines a "modeless" dialog.
 * 
 * @see	DwtBaseDialog.MODELESS
 */
DwtDialog.MODELESS = DwtBaseDialog.MODELESS;

/**
 * Defines a "modal" dialog.
 * 
 * @see	DwtBaseDialog.MODAL
 */
DwtDialog.MODAL = DwtBaseDialog.MODAL;

//
// Data
//
/**
 * @private
 */
DwtDialog.prototype.CONTROLS_TEMPLATE = "dwt.Widgets#DwtDialogControls";

//
// Public methods
//

/**
 * This method will pop-down the dialog.
 * 
 */
DwtDialog.prototype.popdown =
function() {
	DwtBaseDialog.prototype.popdown.call(this);
	this.resetButtonStates();
};

/**
 * This method will pop-up the dialog.
 * 
 * @param	{String}	loc		the location
 * @param	{String}	focusButtonId		the button Id
 */
DwtDialog.prototype.popup =
function(loc, focusButtonId) {
	this._focusButtonId = focusButtonId;
	DwtBaseDialog.prototype.popup.call(this, loc);
};

/**
 * @private
 */
DwtDialog.prototype._resetTabFocus =
function(){
	if (this._focusButtonId) {
		var focusButton = this.getButton(this._focusButtonId);
		this._tabGroup.setFocusMember(focusButton, true);
	} else {
		DwtBaseDialog.prototype._resetTabFocus.call(this);
	}
};

/**
* Resets the dialog back to original state after being constructed by clearing any
* detail message and resetting the standard button callbacks.
* 
*/
DwtDialog.prototype.reset =
function() {
	this._resetCallbacks();
	this.resetButtonStates();
	DwtBaseDialog.prototype.reset.call(this);
};

/**
 * Sets all buttons back to inactive state.
 * 
 */
DwtDialog.prototype.resetButtonStates =
function() {
	for (b in this._button) {
		this._button[b].setEnabled(true);
		this._button[b].setHovered(false);
	}
	this.associateEnterWithButton(this._initialEnterButtonId);
};

/**
 * Gets a button by the specified Id.
 * 
 * @param	{constant}		buttonId		the button Id
 * @return	{DwtButton}		the button or <code>null</code> if not found
 */
DwtDialog.prototype.getButton =
function(buttonId) {
	return this._button[buttonId];
};

/**
 * Sets the button enabled state.
 * 
 * @param	{constant}		buttonId		the button Id
 * @param	{Boolean}		enabled		<code>true</code> to enable the button; <code>false</code> otherwise
 */
DwtDialog.prototype.setButtonEnabled = 
function(buttonId, enabled) {
	this._button[buttonId].setEnabled(enabled);
};

/**
 * Sets the button visible state.
 * 
 * @param	{constant}		buttonId		the button Id
 * @param	{Boolean}		enabled		<code>true</code> to make the button visible; <code>false</code> otherwise
 */
DwtDialog.prototype.setButtonVisible = 
function(buttonId, visible) {
	this._button[buttonId].setVisible(visible);
};

/**
 * Gets the button enabled state.
 * 
 * @param	{constant}		buttonId		the button Id
 * @return	{Boolean}	if <code>true</code>, the button is enabled; <code>false</code> otherwise
 */
DwtDialog.prototype.getButtonEnabled = 
function(buttonId) {
	return this._button[buttonId].getEnabled();
};

/**
 * Registers a callback for a given button. Can be passed an AjxCallback,
 * or the params needed to create one.
 *
 * @param {constant}		buttonId	one of the standard dialog buttons
 * @param {AjxCallback}	func		the callback method
 * @param {Object}		obj			the callback object
 * @param {Array}		args		the callback args
 */
DwtDialog.prototype.registerCallback =
function(buttonId, func, obj, args) {
	this._buttonDesc[buttonId].callback = (func instanceof AjxCallback)
		? func : (new AjxCallback(obj, func, args));
};

/**
 * Unregisters a callback for a given button.
 *
 * @param {constant}		buttonId	one of the standard dialog buttons
 */
DwtDialog.prototype.unregisterCallback =
function(buttonId) {
	this._buttonDesc[buttonId].callback = null;
};

/**
 * Sets the given listener as the only listener for the given button.
 *
 * @param {constant}		buttonId	one of the standard dialog buttons
 * @param {AjxListener}			listener	a listener
 */
DwtDialog.prototype.setButtonListener =
function(buttonId, listener) {
	this._button[buttonId].removeSelectionListeners();
	this._button[buttonId].addSelectionListener(listener);
};

/**
 * Sets the enter key listener.
 * 
 * @param	{AjxListener}	listener	a listener
 */
DwtDialog.prototype.setEnterListener =
function(listener) {
	this.removeAllListeners(DwtEvent.ENTER);
	this.addEnterListener(listener);
};

/**
 * Associates the "enter" key with a given button.
 * 
 * @param {constant}		buttonId	one of the standard dialog buttons
 */
DwtDialog.prototype.associateEnterWithButton =
function(id) {
	this._enterButtonId = id;
};

/**
 * @private
 */
DwtDialog.prototype.getKeyMapName = 
function() {
	return "DwtDialog";
};

/**
 * Handles a key action.
 * 
 * @param	{DwtKeyMap}	actionCode	the key action code
 * @param	{DwtKeyEvent}	ev		the key event
 * @return	{Boolean}	<code>true</code> if the event is handled; <code>false</code> otherwise
 */
DwtDialog.prototype.handleKeyAction =
function(actionCode, ev) {
	switch (actionCode) {
		
		case DwtKeyMap.ENTER:
			this.notifyListeners(DwtEvent.ENTER, ev);
			break;
			
		case DwtKeyMap.CANCEL:
			// hitting ESC should act as a cancel
			var handled = false;
			handled = handled || this._runCallbackForButtonId(DwtDialog.CANCEL_BUTTON);
			handled = handled || this._runCallbackForButtonId(DwtDialog.NO_BUTTON);
			handled = handled || this._runCallbackForButtonId(DwtDialog.DISMISS_BUTTON);
			this.popdown();
			return true;

		case DwtKeyMap.YES:
			if (this._buttonDesc[DwtDialog.YES_BUTTON]) {
				this._runCallbackForButtonId(DwtDialog.YES_BUTTON);
			}
			break;

		case DwtKeyMap.NO:
			if (this._buttonDesc[DwtDialog.NO_BUTTON]) {
				this._runCallbackForButtonId(DwtDialog.NO_BUTTON);
			}
			break;

		default:
			return false;
	}
	return true;
};

//
// Protected methods
//

/**
 * @private
 */
DwtDialog.prototype._createHtmlFromTemplate =
function(templateId, data) {
	DwtBaseDialog.prototype._createHtmlFromTemplate.call(this, templateId, data);

	var focusId = data.id+"_focus";
	if (document.getElementById(focusId)) {
		this._focusElementId = focusId;
	}
	this._buttonsEl = document.getElementById(data.id+"_buttons");
	if (this._buttonsEl) {
		var html = [];
		var idx = 0;
		this._addButtonsHtml(html,idx);
		this._buttonsEl.innerHTML = html.join("");
	}
};

// TODO: Get rid of these button template methods!
/**
 * @private
 */
DwtDialog.prototype._getButtonsContainerStartTemplate =
function () {
	return "<table cellspacing='0' cellpadding='0' border='0' width='100%'><tr>";
};

/**
 * @private
 */
DwtDialog.prototype._getButtonsAlignStartTemplate =
function () {
	return "<td align=\"{0}\"><table cellspacing='5' cellpadding='0' border='0'><tr>";
};

/**
 * @private
 */
DwtDialog.prototype._getButtonsAlignEndTemplate =
function () {
	return "</tr></table></td>";
};

/**
 * @private
 */
DwtDialog.prototype._getButtonsCellTemplate =
function () {
	return "<td id=\"{0}\"></td>";
};

/**
 * @private
 */
DwtDialog.prototype._getButtonsContainerEndTemplate =
function () {
	return  "</tr></table>";
};

/**
 * @private
 */
DwtDialog.prototype._addButtonsHtml =
function(html, idx) {
	if (this._buttonList && this._buttonList.length) {
		var leftButtons = new Array();
		var rightButtons = new Array();
		var centerButtons = new Array();
		for (var i = 0; i < this._buttonList.length; i++) {
			var buttonId = this._buttonList[i];
			switch (this._buttonDesc[buttonId].align) {
				case DwtDialog.ALIGN_RIGHT: 	rightButtons.push(buttonId); break;
				case DwtDialog.ALIGN_LEFT: 		leftButtons.push(buttonId); break;
				case DwtDialog.ALIGN_CENTER:	centerButtons.push(buttonId); break;
			}
		}
		html[idx++] = this._getButtonsContainerStartTemplate();
		
		if (leftButtons.length) {
			html[idx++] = AjxMessageFormat.format(
								  this._getButtonsAlignStartTemplate(),
								  ["left"]);
			for (var i = 0; i < leftButtons.length; i++) {
				var buttonId = leftButtons[i];
				var cellTemplate = this._buttonDesc[buttonId].cellTemplate ? 
					this._buttonDesc[buttonId].cellTemplate : this._getButtonsCellTemplate();
		 		html[idx++] = AjxMessageFormat.format(
								  cellTemplate,
								  [this._buttonElementId[buttonId]]);
		 	}
			html[idx++] = this._getButtonsAlignEndTemplate();
		}
		if (centerButtons.length){
			html[idx++] = AjxMessageFormat.format(
								this._getButtonsAlignStartTemplate(),
								["center"]);
			for (var i = 0; i < centerButtons.length; i++) {
				var buttonId = centerButtons[i];
				var cellTemplate = this._buttonDesc[buttonId].cellTemplate ? 
					this._buttonDesc[buttonId].cellTemplate : this._getButtonsCellTemplate();				
		 		html[idx++] = AjxMessageFormat.format(
								cellTemplate,
								[this._buttonElementId[buttonId]]);
		 	}
			html[idx++] = this._getButtonsAlignEndTemplate();
		}
		if (rightButtons.length) {
			html[idx++] = AjxMessageFormat.format(
								this._getButtonsAlignStartTemplate(),
								["right"]);
			for (var i = 0; i < rightButtons.length; i++) {
				var buttonId = rightButtons[i];
				var cellTemplate = this._buttonDesc[buttonId].cellTemplate ? 
					this._buttonDesc[buttonId].cellTemplate : this._getButtonsCellTemplate();				

		 		html[idx++] = AjxMessageFormat.format(cellTemplate,
													[this._buttonElementId[buttonId]]);
		 	}
			html[idx++] = this._getButtonsAlignEndTemplate();
		}
		html[idx++] = this._getButtonsContainerEndTemplate();
	}	
	return idx;
};

/**
 * Button listener that checks for callbacks.
 * 
 * @private
 */
DwtDialog.prototype._buttonListener =
function(ev, args) {
	var obj = DwtControl.getTargetControl(ev);
	var buttonId = (obj && obj.buttonId) || this._enterButtonId;
	if (buttonId) {
		this._runCallbackForButtonId(buttonId, args);
	}
};

/**
 * @private
 */
DwtDialog.prototype._runCallbackForButtonId =
function(id, args) {
	var buttonDesc = this._buttonDesc[id];
	var callback = buttonDesc && buttonDesc.callback;
	if (!callback) return false;
	args = (args instanceof Array) ? args : [args];
	callback.run.apply(callback, args);
	return true;
};

/**
 * @private
 */
DwtDialog.prototype._runEnterCallback =
function(args) {
	if (this._enterButtonId && this.getButtonEnabled(this._enterButtonId)) {
		this._runCallbackForButtonId(this._enterButtonId, args);
	}
};

/**
 * Default callbacks for the standard buttons.
 * 
 * @private
 */
DwtDialog.prototype._resetCallbacks =
function() {
	if (this._buttonDesc) {
		for (var i = 0; i < DwtDialog.ALL_BUTTONS.length; i++) {
			var id = DwtDialog.ALL_BUTTONS[i];
			if (this._buttonDesc[id])
				this._buttonDesc[id].callback = new AjxCallback(this, this.popdown);
		}
	}
};

//
// Classes
//

/**
 * @class
 * This class represents a button descriptor.
 * 
 * @param	{String}	id		the button Id
 * @param	{String}	label		the button label
 * @param	{constant}	align		the alignment
 * @param	{AjxCallback}	callback		the callback
 * @param	{String}	cellTemplate		the template
 */
DwtDialog_ButtonDescriptor = function(id, label, align, callback, cellTemplate) {
	this.id = id;
	this.label = label;
	this.align = align;
	this.callback = callback;
	this.cellTemplate = cellTemplate;
};
