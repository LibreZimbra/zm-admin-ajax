/*
 * ***** BEGIN LICENSE BLOCK *****
 * 
 * Zimbra Collaboration Suite Web Client
 * Copyright (C) 2005, 2006, 2007 Zimbra, Inc.
 * 
 * The contents of this file are subject to the Yahoo! Public License
 * Version 1.0 ("License"); you may not use this file except in
 * compliance with the License.  You may obtain a copy of the License at
 * http://www.zimbra.com/license.
 * 
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied.
 * 
 * ***** END LICENSE BLOCK *****
 */

/**
 * @constructor
 * @class
 * A composite may contain other controls. All controls that need to contain child controls
 * (such as menus, trees) should inherit from this class.
 * 
 * @author Ross Dargahi
 * 
 * @param params		[hash]				hash of params:
 *        parent		[DwtComposite] 		parent widget
 *        className		[string]*			CSS class
 *        posStyle		[constant]*			positioning style
 *        deferred		[boolean]*			if true, postpone initialization until needed
 *        id			[string]*			an explicit ID to use for the control's HTML element
 *        index 		[int]*				index at which to add this control among parent's children 
 */
DwtComposite = function(params) {
	if (arguments.length == 0) { return; }
	params = Dwt.getParams(arguments, DwtComposite.PARAMS);
	
	params.className = params.className || "DwtComposite";
	DwtControl.call(this, params);

	/** Vector of child elements
	 * @type AjxVector */
	this._children = new AjxVector();
}

DwtComposite.PARAMS = DwtControl.PARAMS.concat();

DwtComposite.prototype = new DwtControl;
DwtComposite.prototype.constructor = DwtComposite;

/** Pending elements hash (i.e. elements that have not yet been realized)
 * @type object */
DwtComposite._pendingElements = new Object();


/**
 * This method returns this objects real class name
 * 
 * @return class name
 * @type String
 */
DwtComposite.prototype.toString = 
function() {
	return "DwtComposite";
}

/**
 * Disposes of the control. This method will remove the control from under the
 * control of it's parent and release any resources associate with the compontent
 * it will also notify any event listeners on registered  <i>DwtEvent.DISPOSE</i> event type
 * 
 * In the case of <i>DwtComposite</i> this method will also dispose of all of the composite's
 * children
 * 
 * Subclasses may override this method to perform their own dispose functionality but
 * should generallly call up to the parent method
 * 
 * @see DwtControl#isDisposed
 * @see DwtControl#addDisposeListener
 * @see DwtControl#removeDisposeListener
 */
DwtComposite.prototype.dispose =
function() {
	if (this._disposed) return;

	var children = this._children.getArray();
	while (children.length > 0)
		children[0].dispose();

	DwtControl.prototype.dispose.call(this);
}

/**
 * @type array
 */
DwtComposite.prototype.getChildren =
function() {
	return this._children.getArray().slice(0);
}

/**
 * @return the composite's number of children
 * @type number
 */
DwtComposite.prototype.getNumChildren =
function() {
	return this._children.size();
}

/**
 * Disposes of all of the composite's children
 */
DwtComposite.prototype.removeChildren =
function() {
	var a = this._children.getArray();
	while (a.length > 0)
		a[0].dispose();
}

/**
 * Removes all of the composite's child by calling <code>removeChildren</code> and
 * also clears out the composite's HTML element of any content
 * 
 * @see #removeChildren
 */
DwtComposite.prototype.clear =
function() {
	this.removeChildren();
	this.getHtmlElement().innerHTML = "";
}

/**
* Adds the given child control to this composite.
*
* @param {DwtControl} child	The child control to add
* @param {number} index index at which to add the child (optional)
*/
DwtComposite.prototype.addChild =
function(child, index) {
	this._children.add(child, index);
	
	// check for a previously removed element
	var childHtmlEl = child.getHtmlElement();
	childHtmlEl.setAttribute("parentId", this._htmlElId);
	if (this instanceof DwtShell && this.isVirtual()) {
		// If we are operating in "virtual shell" mode, then children of the shell's html elements
		// are actually parented to the body
		document.body.appendChild(childHtmlEl);
	} else {
		child.reparentHtmlElement(child.__parentElement || this.getHtmlElement(), index);
		child.__parentElement = null; // don't keep the reference to element, if any
	}
};

/**
* Removes the given child control from this control. A removed child is no longer retrievable via
* <code>getHtmlElement()</code>, so there is an option to save a reference to the removed child. 
* That way it can be added later using <code>addChild()</code>.
*
* @param {DwtConrol} child the child control to remove
* 
* @see #addChild
*/
DwtComposite.prototype.removeChild =
function(child) {
	DBG.println(AjxDebug.DBG3, "DwtComposite.prototype.removeChild: " + child._htmlElId + " - " + child.toString());
	// Make sure that the child is initialized. Certain children (such as DwtTreeItems)
	// can be created in a deferred manner (i.e. they will only be initialized if they
	// are becoming visible.
	if (child.isInitialized()) {
		this._children.remove(child);
		// Sometimes children are nested in arbitrary HTML so we elect to remove them
		// in this fashion rather than use this.getHtmlElement().removeChild(child.getHtmlElement()
		var childHtmlEl = child.getHtmlElement();
        if (childHtmlEl) {
			childHtmlEl.removeAttribute("parentId");
			if (childHtmlEl.parentNode) {
				var el = childHtmlEl.parentNode.removeChild(childHtmlEl);
			}
		}
	}
}

/**
 * Allows the user to use the mouse to select text on the control.
 */
DwtComposite.prototype._setAllowSelection =
function() {
	if (!this._allowSelection) {
		this._allowSelection = true;
		this.addListener(DwtEvent.ONMOUSEDOWN, new AjxListener(this, this._mouseDownListener));
		this.addListener(DwtEvent.ONCONTEXTMENU, new AjxListener(this, this._contextMenuListener));
	}
};

/**
 * Determines whether to prevent the browser from allowing text selection.
 * 
 * @see DwtControl#preventSelection
 */
DwtComposite.prototype.preventSelection = 
function(targetEl) {
	return this._allowSelection ? false : DwtControl.prototype.preventSelection.call(this, targetEl);
};

/**
 * Determines whether to prevent the browser from displaying its context menu.
 * 
 * @see DwtControl#preventContextMenu
 */
DwtComposite.prototype.preventContextMenu =
function(target) {
	if (!this._allowSelection) {
		return DwtControl.prototype.preventContextMenu.apply(this, arguments);
	}
	
	var bObjFound = target ? (target.id.indexOf("OBJ_") == 0) : false;
	var bSelection = false;

	// determine if anything has been selected (IE and mozilla do it differently)
	if (document.selection) {			// IE
		bSelection = document.selection.type == "Text";
	} else if (getSelection()) {		// mozilla
		bSelection = getSelection().toString().length > 0;
	}

	// if something has been selected and target is not a custom object,
	return (bSelection && !bObjFound) ? false : true;
};

/**
 * Handles focus control when the mouse button is released
 * 
 * @see DwtControl#_focusByMouseUpEvent
 */
DwtComposite.prototype._focusByMouseUpEvent =
function()  {
	if (!this._allowSelection) {
		DwtControl.prototype._focusByMouseUpEvent.apply(this, arguments);
	}
	// ...Else do nothing....
	// When text is being selected, we don't want the superclass
	// to give focus to the keyboard input control.
};

/**
 * Event listener that is only registered when this control allows selection
 * 
 * @see _allowSelection
 */
DwtComposite.prototype._mouseDownListener =
function(ev) {
	if (ev.button == DwtMouseEvent.LEFT) {
		// reset mouse event to propagate event to browser (allows text selection)
		ev._stopPropagation = true;
		ev._returnValue = true;
	}
};

/**
 * Event listener that is only registered when this control allows selection
 * 
 * @see _allowSelection
 */
DwtComposite.prototype._contextMenuListener =
function(ev) {
	// reset mouse event to propagate event to browser (allows context menu)
	ev._stopPropagation = false;
	ev._returnValue = true;
};
