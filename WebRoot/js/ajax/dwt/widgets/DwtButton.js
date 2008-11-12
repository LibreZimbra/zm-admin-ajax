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
 * This class represents a button, which is basically a smart label that can handle
 * various UI events. It knows when it has been hovered (the mouse is over it),
 * when it is active (mouse down), and when it has been pressed (mouse up).
 * In addition to a label's image and/or text, a button may have a dropdown menu.
 *
 * There are several different types of button:
 * <ul>
 * <li> Push - this is the standard push button </li>
 * <li> Toggle - This is a button that exhibits selectable behaviour when clicked
 * 		e.g. on/off. To make a button selectable style "or" <i>DwtButton.SELECT_STYLE<i>
 * 		to the consturctor's style parameter</li>
 * <li> Menu - By setting a mene via the <i>setMenu</i> method a button will become
 * 		a drop down or menu button.</li>
 * </ul>
 *
 * <h4>CSS</h4>
 * <ul>
 * <li><i>className</i>-hover - hovered style
 * <li><i>className</i>-active - mouse down style
 * <li><i>className</i>-selected - permanently down style
 * <li><i>className</i>-disabled - disabled style
 * </ul>
 *
 * <h4>Keyboard Actions</h4>
 * <ul>
 * <li>DwtKeyMap.SELECT - triggers the button</li>
 * <li>DwtKeyMap.SUBMENU - display's the button's submenu if one is set
 * </ul>
 *
 * @author Ross Dargahi
 * @author Conrad Damon
 * 
 * @param params		[hash]				hash of params:
 *        parent		[DwtComposite] 		parent widget
 *        style			[constant]*			button style
 *        className		[string]*			CSS class
 *        posStyle		[constant]*			positioning style
 *        actionTiming	[constant]*			if DwtButton.ACTION_MOUSEUP, then the button is triggered
 *											on mouseup events, else if DwtButton.ACTION_MOUSEDOWN,
 * 											then the button is triggered on mousedown events
 *        id			[string]*			ID to use for the control's HTML element
 *        index 		[int]*				index at which to add this control among parent's children
 *        listeners		[hash]*				event listeners
 */
DwtButton = function(params) {
	if (arguments.length == 0) { return; }
	params = Dwt.getParams(arguments, DwtButton.PARAMS);
	
	params.className = params.className || "ZButton";
	DwtLabel.call(this, params);

	var parent = params.parent;
	if (!parent._hasSetMouseEvents || AjxEnv.isIE) {
		this._setMouseEvents();
	}
	
	var events;
	if (parent._hasSetMouseEvents) {
		events = AjxEnv.isIE ? [DwtEvent.ONMOUSEENTER, DwtEvent.ONMOUSELEAVE] : [];
	} else {
		events = AjxEnv.isIE ? [DwtEvent.ONMOUSEENTER, DwtEvent.ONMOUSELEAVE] :
							   [DwtEvent.ONMOUSEOVER, DwtEvent.ONMOUSEOUT];
		events = events.concat([DwtEvent.ONMOUSEDOWN, DwtEvent.ONMOUSEUP]);
	}
	if (events && events.length) {
		this._setEventHdlrs(events);
	}
	this._listeners = params.listeners || DwtButton._listeners;
	this._addMouseListeners();
	this._ignoreInternalOverOut = true;
	
	this._dropDownEvtMgr = new AjxEventMgr();

	this._selected = false;

	this._actionTiming = params.actionTiming || DwtButton.ACTION_MOUSEUP;
	this.__preventMenuFocus = null;
}

DwtButton.PARAMS = ["parent", "style", "className", "posStyle", "actionTiming", "id", "index", "listeners"];

DwtButton.prototype = new DwtLabel;
DwtButton.prototype.constructor = DwtButton;

DwtButton.prototype.toString =
function() {
	return "DwtButton";
}

//
// Constants
//

// NOTE: These must be powers of 2 because we do bit-arithmetic to
//       check the style.
DwtButton.TOGGLE_STYLE = DwtLabel._LAST_STYLE * 2;
DwtButton.ALWAYS_FLAT = DwtLabel._LAST_STYLE * 4;

DwtButton._LAST_STYLE = DwtButton.ALWAYS_FLAT;

DwtButton.ACTION_MOUSEUP = 1;
DwtButton.ACTION_MOUSEDOWN = 2; // No special appearance when hovered or active

// Time (in ms) during which to block additional clicks from being processed
DwtButton.NOTIFY_WINDOW = 500;

//
// Data
//

DwtButton.prototype.TEMPLATE = "dwt.Widgets#ZButton"

//
// Public methods
//

DwtButton.prototype.dispose =
function() {
	if ((this._menu instanceof DwtMenu) && (this._menu.parent == this)) {
		this._menu.dispose();
		this._menu = null;
	}
	DwtLabel.prototype.dispose.call(this);
};

/**
 * Adds a listener to be notified when the button is pressed.
 *
 * @param listener	[AjxListener]	a listener
 * @param index		[int]*			index at which to add listener
 */
DwtButton.prototype.addSelectionListener =
function(listener, index) {
	this.addListener(DwtEvent.SELECTION, listener, index);
}

/**
* Removes a selection listener.
*
* @param listener	the listener to remove
*/
DwtButton.prototype.removeSelectionListener =
function(listener) {
	this.removeListener(DwtEvent.SELECTION, listener);
}

/**
* Removes all the selection listeners.
*/
DwtButton.prototype.removeSelectionListeners =
function() {
	this.removeAllListeners(DwtEvent.SELECTION);
}

/**
* Adds a listener to be notified when the dropdown arrow is pressed.
*
* @param listener	a listener
*/
DwtButton.prototype.addDropDownSelectionListener =
function(listener) {
	return this._dropDownEvtMgr.addListener(DwtEvent.SELECTION, listener);
}

/**
* Removes a dropdown selection listener.
*
* @param listener	the listener to remove
*/
DwtButton.prototype.removeDropDownSelectionListener =
function(listener) {
	this._dropDownEvtMgr.removeListener(DwtEvent.SELECTION, listener);
}

// defaults for drop down images (set here once on prototype rather than on each button instance)
DwtButton.prototype._dropDownImg 	= "SelectPullDownArrow";
DwtButton.prototype._dropDownDepImg	= "SelectPullDownArrow";
DwtButton.prototype._dropDownHovImg = "SelectPullDownArrowHover";

DwtButton.prototype.setDropDownImages = function (enabledImg, disImg, hovImg, depImg) {
	this._dropDownImg = enabledImg;
//	this._dropDownDisImg = disImg;
	this._dropDownHovImg = hovImg;
	this._dropDownDepImg = depImg;
};

DwtButton.prototype._addEventListeners =
function(listeners, events) {
	for (var i = 0; i < events.length; i++) {
		this.addListener(event, listeners[event]);
	}
};

DwtButton.prototype._removeEventListeners =
function(listeners, events) {
	for (var i = 0; i < events.length; i++) {
		this.removeListener(event, listeners[event]);
	}
};

DwtButton.prototype._addMouseListeners =
function() {
	var events = [DwtEvent.ONMOUSEDOWN, DwtEvent.ONMOUSEUP];
	events = events.concat(AjxEnv.isIE ? [DwtEvent.ONMOUSEENTER, DwtEvent.ONMOUSELEAVE] :
										 [DwtEvent.ONMOUSEOVER, DwtEvent.ONMOUSEOUT]);
	for (var i = 0; i < events.length; i++) {
		this.addListener(events[i], this._listeners[events[i]]);
	}
};

DwtButton.prototype._removeMouseListeners =
function() {
	var events = [DwtEvent.ONMOUSEDOWN, DwtEvent.ONMOUSEUP];
	events = events.concat(AjxEnv.isIE ? [DwtEvent.ONMOUSEENTER, DwtEvent.ONMOUSELEAVE] :
										 [DwtEvent.ONMOUSEOVER, DwtEvent.ONMOUSEOUT]);
	for (var i = 0; i < events.length; i++) {
		this.removeListener(events[i], this._listeners[events[i]]);
	}
};

DwtButton.prototype.setDisplayState =
function(state, force) {
    if (this._selected && state != DwtControl.SELECTED && !force) {
        state = [ DwtControl.SELECTED, state ].join(" ");
    }
    DwtLabel.prototype.setDisplayState.call(this, state);
};

/**
* Sets the enabled/disabled state of the button. A disabled button may have a different
* image, and greyed out text. The button (and its menu) will only have listeners if it
* is enabled.
*
* @param enabled	whether to enable the button
*
*/
DwtButton.prototype.setEnabled =
function(enabled) {
	if (enabled != this._enabled) {
		DwtLabel.prototype.setEnabled.call(this, enabled); // handles image/text
        if (enabled) {
			this._addMouseListeners();
			// set event handler for pull down menu if applicable
			if (this._menu) {
				this._setupDropDownCellMouseHandlers();
                if (this._dropDownEl) {
                    AjxImg.setImage(this._dropDownEl, this._dropDownImg);
                }
            }

		} else {
			this._removeMouseListeners();
			// remove event handlers for pull down menu if applicable
			if (this._menu) {
				this._removeDropDownCellMouseHandlers();
                if (this._dropDownEl) {
                    AjxImg.setDisabledImage(this._dropDownEl, this._dropDownImg);
                }
			}
		}
	}
}

DwtButton.prototype.setImage =
function(imageInfo) {
	DwtLabel.prototype.setImage.call(this, imageInfo);
	this._setMinWidth();
}

DwtButton.prototype.setText =
function(text) {
	DwtLabel.prototype.setText.call(this, text);
	this._setMinWidth();
}

DwtButton.prototype._setMinWidth =
function() {
	if (this.getText() != null) {
		Dwt.addClass(this.getHtmlElement(), "ZHasText");
	} else {
		Dwt.delClass(this.getHtmlElement(), "ZHasText");
	}
}

DwtButton.prototype.setHoverImage =
function (hoverImageInfo) {
    this._hoverImageInfo = hoverImageInfo;
}
/**
* Adds a dropdown menu to the button, available through a small down-arrow.
*
* @param menuOrCallback		The dropdown menu or an AjxCallback object. If a
*                           callback is given, it is called the first time the
*                           menu is requested. The callback must return a valid
*                           DwtMenu object.
* @param shouldToggle
* @param followIconStyle	style of menu item (should be checked or radio style) for
*							which the button icon should reflect the menu item icon
*/
DwtButton.prototype.setMenu =
function(menuOrCallback, shouldToggle, followIconStyle) {
	this._menu = menuOrCallback;
	this._shouldToggleMenu = (shouldToggle === true);
	this._followIconStyle = followIconStyle;
	if (this._menu) {
        if (this._dropDownEl) {
			var idx = (this._imageCell) ? 1 : 0;
			if (this._textCell)
				idx++;

			Dwt.addClass(this.getHtmlElement(), "ZHasDropDown");
            AjxImg.setImage(this._dropDownEl, this._dropDownImg);

			// set event handler if applicable
			if (this._enabled) {
				this._setupDropDownCellMouseHandlers();
			}

            if (!(this._menu instanceof AjxCallback)) {
                this._menu.setAssociatedElementId(this._dropDownEl.id);
            }
		}
		if ((this.__preventMenuFocus != null) && (this._menu instanceof DwtMenu))
			this._menu.dontStealFocus(this.__preventMenuFocus);
    }
    else if (this._dropDownEl) {
		Dwt.delClass(this.getHtmlElement(), "ZHasDropDown");
        this._dropDownEl.innerHTML = "";
    }
}

DwtButton.prototype._setupDropDownCellMouseHandlers =
function() {
	this._dropDownEventsEnabled = true;
};

DwtButton.prototype._removeDropDownCellMouseHandlers =
function() {
	this._dropDownEventsEnabled = false;
};

/**
* Returns the button's menu
*
* @param dontCreate	 If true the menu will not be lazily created here.
*/
DwtButton.prototype.getMenu =
function(dontCreate) {
	if (this._menu instanceof AjxCallback) {
		if (dontCreate) {
			return null;
		}
		var callback = this._menu;
		this.setMenu(callback.run());
		if ((this.__preventMenuFocus != null) && (this._menu instanceof DwtMenu))
			this._menu.dontStealFocus(this.__preventMenuFocus);
	}
    if (this._menu) {
        this.getHtmlElement().setAttribute("menuId", this._menu._htmlElId);
    }
    return this._menu;
}

/**
* Returns the button display to normal (not hovered or active).
*/
DwtButton.prototype.resetClassName =
function() {
    this.setDisplayState(DwtControl.NORMAL);
}
/*
 * Sets whether actions for this button should occur on mouse up or mouse
 * down.
 *
 * Currently supports DwtButton.ACTION_MOUSEDOWN and DwtButton.ACTION_MOUSEUP
 */
DwtButton.prototype.setActionTiming =
function(actionTiming) {
      this._actionTiming = actionTiming;
};

/**
* Activates/inactivates the button. A button is hovered when the mouse is over it.
*
* @param hovered		whether the button is hovered
*/
DwtButton.prototype.setHovered =
function(hovered) {
    this.setDisplayState(hovered ? DwtControl.HOVER : DwtControl.NORMAL);
}

DwtButton.prototype.setEnabledImage =
function (imageInfo) {
	this._enabledImageInfo = imageInfo;
	this.setImage(imageInfo);
}

DwtButton.prototype.setDepressedImage =
function (imageInfo) {
    this._depressedImageInfo = imageInfo;
}

DwtButton.prototype.setSelected =
function(selected) {
	if (this._selected != selected) {
		this._selected = selected;
        this.setDisplayState(selected ? DwtControl.SELECTED : DwtControl.NORMAL);
    }
}

DwtButton.prototype.isToggled =
function() {
	return this._selected;
}

DwtButton.prototype.popup =
function(menu) {
	menu = menu || this.getMenu();

    if (!menu)
		return;

    var parent = menu.parent;
	var parentBounds = parent.getBounds();
	var windowSize = menu.shell.getSize();
	var menuSize = menu.getSize();
	var parentElement = parent.getHtmlElement();
	// since buttons are often absolutely positioned, and menus aren't, we need x,y relative to window
	var parentLocation = Dwt.toWindow(parentElement, 0, 0);
	var verticalBorder = (parentElement.style.borderLeftWidth == "") ? 0 : parseInt(parentElement.style.borderLeftWidth);
	var x = parentLocation.x + verticalBorder;
	x = ((x + menuSize.x) >= windowSize.x) ? windowSize.x - menuSize.x : x;
	var horizontalBorder = (parentElement.style.borderTopWidth == "") ? 0 : parseInt(parentElement.style.borderTopWidth);
	horizontalBorder += (parentElement.style.borderBottomWidth == "") ? 0 : parseInt(parentElement.style.borderBottomWidth);
	var y = parentLocation.y + parentBounds.height + horizontalBorder;
	menu.popup(0, x, y);
};

DwtButton.prototype.getKeyMapName =
function() {
	return "DwtButton";
};

DwtButton.prototype.handleKeyAction =
function(actionCode, ev) {
	switch (actionCode) {
		case DwtKeyMap.SELECT:
			this._emulateSingleClick();
			break;

		case DwtKeyMap.SUBMENU:
			var menu = this.getMenu();
			if (!menu) return false;
			this._emulateDropDownClick();
			menu.setSelectedItem(0);
			break;
	}

	return true;
}

// Private methods

DwtButton.prototype._emulateSingleClick =
function() {
	this.trigger();
	var htmlEl = this.getHtmlElement();
	var p = Dwt.toWindow(htmlEl);
	var mev = new DwtMouseEvent();
	this._setMouseEvent(mev, {dwtObj:this, target:htmlEl, button:DwtMouseEvent.LEFT, docX:p.x, docY:p.y});
	if (this._actionTiming == DwtButton.ACTION_MOUSEDOWN) {
		this.notifyListeners(DwtEvent.ONMOUSEDOWN, mev);
	} else {
		this.notifyListeners(DwtEvent.ONMOUSEUP, mev);
	}
};

DwtButton.prototype._emulateDropDownClick =
function() {
    var htmlEl = this._dropDownEl;
    if (!htmlEl) { return; }

	var p = Dwt.toWindow(htmlEl);
	var mev = new DwtMouseEvent();
	this._setMouseEvent(mev, {dwtObj:this, target:htmlEl, button:DwtMouseEvent.LEFT, docX:p.x, docY:p.y});
	DwtButton._dropDownCellMouseDownHdlr(mev);
};

/** This method is called from mouseUpHdlr in <i>DwtControl</i>. */
DwtButton.prototype._focusByMouseUpEvent =
function()  {
	// don't steal focus if on a toolbar that's not part of focus ring
	if (!(this.parent && (this.parent instanceof DwtToolBar) && this.parent.noFocus)) {
		DwtShell.getShell(window).getKeyboardMgr().grabFocus(this.getTabGroupMember());
	}
};

// NOTE: _focus and _blur will be reworked to reflect styles correctly
DwtButton.prototype._focus =
function() {
    this.setDisplayState(DwtControl.FOCUSED);
}

DwtButton.prototype._blur =
function() {
    this.setDisplayState(DwtControl.NORMAL);
}

DwtButton.prototype._toggleMenu =
function () {
	if (this._shouldToggleMenu){
        var menu = this.getMenu();
        if (!menu.isPoppedup()){
			this.popup();
			this._menuUp = true;
		} else {
			menu.popdown();
			this._menuUp = false;
            this.deactivate();
        }
	} else {
		this.popup();
	}
};

DwtButton.prototype._isDropDownEvent =
function(ev) {
	if (this._dropDownEventsEnabled && this._dropDownEl) {
		var mouseX = ev.docX;
		var dropDownX = Dwt.toWindow(this._dropDownEl, 0, 0, window).x;
		if (mouseX >= dropDownX) {
			return true;
		}
	}
	return false;
};

DwtButton.prototype.trigger =
function (){
    if (this._depressedImageInfo) {
        this.setImage(this._depressedImageInfo);
    }
    this.setDisplayState(DwtControl.ACTIVE, true);
    this.isActive = true;
};

DwtButton.prototype.deactivate =
function (){
	if (this._hoverImageInfo){
		this.setImage(this._hoverImageInfo);
	}

	if (this._style & DwtButton.TOGGLE_STYLE){
		this._selected = !this._selected;
	}
    this.setDisplayState(DwtControl.HOVER);
};

DwtButton.prototype.dontStealFocus = function(val) {
	if (val == null)
		val = true;
	if (this._menu instanceof DwtMenu)
		this._menu.dontStealFocus(val);
	this.__preventMenuFocus = val;
};

DwtButton.prototype._handleClick =
function(ev) {
	if (this.isListenerRegistered(DwtEvent.SELECTION)) {
		var now = (new Date()).getTime();
		if (!this._lastNotify || (now - this._lastNotify > DwtButton.NOTIFY_WINDOW)) {
			var selEv = DwtShell.selectionEvent;
			DwtUiEvent.copy(selEv, ev);
			selEv.item = this;
			selEv.detail = (typeof this.__detail == "undefined") ? 0 : this.__detail;
			this.notifyListeners(DwtEvent.SELECTION, selEv);
			this._lastNotify = now;
		}
	} else if (this._menu) {
		this._toggleMenu();
	}
};

DwtButton.prototype._setMouseOutClassName =
function() {
    this.setDisplayState(DwtControl.NORMAL);
}

DwtButton.prototype._createHtmlFromTemplate = function(templateId, data) {
    DwtLabel.prototype._createHtmlFromTemplate.call(this, templateId, data);
    this._dropDownEl = document.getElementById(data.id+"_dropdown");
};

// Pops up the dropdown menu.
DwtButton._dropDownCellMouseDownHdlr =
function(ev) {
	var obj = DwtControl.getTargetControl(ev);
    /**
     * Below condition added for the bug 17089
     * If menu is there and already popped up, do pop it down first and then proceed.
     */

    if (obj && obj.getMenu() && obj.getMenu().isPoppedup()){
        obj.getMenu().popdown();
    }

    var mouseEv = DwtShell.mouseEvent;
	mouseEv.setFromDhtmlEvent(ev, obj);

	if (mouseEv.button == DwtMouseEvent.LEFT) {
	    if (this._depImg){
			AjxImg.setImage(this, this._depImg);
	    }

		DwtEventManager.notifyListeners(DwtEvent.ONMOUSEDOWN, mouseEv);

		if (obj._menu instanceof AjxCallback) {
			obj.popup();
		}

		if (obj._dropDownEvtMgr.isListenerRegistered(DwtEvent.SELECTION)) {
	    	var selEv = DwtShell.selectionEvent;
	    	DwtUiEvent.copy(selEv, mouseEv);
	    	selEv.item = obj;
	    	obj._dropDownEvtMgr.notifyListeners(DwtEvent.SELECTION, selEv);
	    } else { 
			obj._toggleMenu();
		}
	}

	mouseEv._stopPropagation = true;
	mouseEv._returnValue = false;
	mouseEv.setToDhtmlEvent(ev);
	return false;
}

// Updates the current mouse event (set from the previous mouse down).
DwtButton._dropDownCellMouseUpHdlr =
function(ev) {
	var mouseEv = DwtShell.mouseEvent;
	mouseEv.setFromDhtmlEvent(ev);

	if (mouseEv.button == DwtMouseEvent.LEFT) {
	    if (this._hovImg && !this.noMenuBar) {
			AjxImg.setImage(this, this._hovImg);
	    }
	}
	mouseEv._stopPropagation = true;
	mouseEv._returnValue = false;
	mouseEv.setToDhtmlEvent(ev);
	return false;
}

// Activates the button.
DwtButton._mouseOverListener =
function(ev) {
	var button = ev.dwtObj;
	if (!button) { return false; }
    if (button._hoverImageInfo) {

	    // if the button is image-only, the following is bad
	    // because DwtLabel#setImage clears the element first
	    // (innerHTML = "") causing a mouseout event, then it
	    // re-sets the image, which results in a new mouseover
	    // event, thus looping forever eating your CPU and
	    // blinking.

	    // this.setImage(this._hoverImageInfo); // sucks.

	    // hope I'm not breaking anything (mihai@zimbra.com):

	    var iconEl = button._getIconEl();
	    iconEl.firstChild.className = AjxImg.getClassForImage(button._hoverImageInfo);
    }
    button.setDisplayState(DwtControl.HOVER);

    var dropDown = button._dropDownEl;
    if (button._menu && dropDown && button._dropDownHovImg && !button.noMenuBar &&
        button.isListenerRegistered(DwtEvent.SELECTION)) {
		AjxImg.setImage(dropDown, button._dropDownHovImg);
    }

    ev._stopPropagation = true;
};

DwtButton._mouseOutListener =
function(ev) {
	var button = ev.dwtObj;
	if (!button) { return false; }
    if (button._hoverImageInfo) {
        button.setImage(button._enabledImageInfo);
    }
	button._setMouseOutClassName();
    button.isActive = false;

    var dropDown = button._dropDownEl;
    if (button._menu && dropDown) {
		AjxImg.setImage(dropDown, button._dropDownImg);
    }
};

DwtButton._mouseDownListener =
function(ev) {
	var button = ev.dwtObj;
	if (!button) { return false; }
	if (button._isDropDownEvent(ev)) {
		return DwtButton._dropDownCellMouseDownHdlr(ev);
	}

	if (ev.button != DwtMouseEvent.LEFT) { return; }

    var dropDown = button._dropDownEl;
    if (button._menu && dropDown && button._dropDownDepImg) {
		AjxImg.setImage(dropDown, button._dropDownDepImg);
    }
	switch (button._actionTiming) {
	  case DwtButton.ACTION_MOUSEDOWN:
		button.trigger();
		button._handleClick(ev);
		break;
	  case DwtButton.ACTION_MOUSEUP:
		button.trigger();
		break;
	}
};

// Button has been pressed, notify selection listeners.
DwtButton._mouseUpListener =
function(ev) {
	var button = ev.dwtObj;
	if (!button) { return false; }
	if (button._isDropDownEvent(ev)) {
		return DwtButton._dropDownCellMouseUpHdlr(ev);
	}
	if (ev.button != DwtMouseEvent.LEFT) { return; }

    var dropDown = button._dropDownEl;
    if (button._menu && dropDown && button._dropDownHovImg && !button.noMenuBar){
		AjxImg.setImage(dropDown, button._dropDownHovImg);
    }
	switch (button._actionTiming) {
	  case DwtButton.ACTION_MOUSEDOWN:
 	    button.deactivate();
		break;

	  case DwtButton.ACTION_MOUSEUP:
	    var el = button.getHtmlElement();
		if (button.isActive) {
			button.deactivate();
			button._handleClick(ev);
		}
		// So that listeners may remove this object from the flow, and not
		// get errors, when DwtControl tries to do a this.getHtmlElement()
		// ROSSD - I don't get this, basically this method does a this.getHtmlElement as the first thing it does
		// so why would the line below cause a problem. It does have the side-effect of making buttons behave weirdly
		// in that they will not remain active on mouse up
		//el.className = this._origClassName;
		break;
	}
};

DwtButton._listeners = {};
DwtButton._listeners[DwtEvent.ONMOUSEOVER] = new AjxListener(null, DwtButton._mouseOverListener);
DwtButton._listeners[DwtEvent.ONMOUSEOUT] = new AjxListener(null, DwtButton._mouseOutListener);
DwtButton._listeners[DwtEvent.ONMOUSEDOWN] = new AjxListener(null, DwtButton._mouseDownListener);
DwtButton._listeners[DwtEvent.ONMOUSEUP] = new AjxListener(null, DwtButton._mouseUpListener);
DwtButton._listeners[DwtEvent.ONMOUSEENTER] = new AjxListener(null, DwtButton._mouseOverListener);
DwtButton._listeners[DwtEvent.ONMOUSELEAVE] = new AjxListener(null, DwtButton._mouseOutListener);
