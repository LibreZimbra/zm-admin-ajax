/*
 * ***** BEGIN LICENSE BLOCK *****
 * Zimbra Collaboration Suite Web Client
 * Copyright (C) 2006, 2007, 2008, 2009, 2010 Zimbra, Inc.
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
 * Creates and loads a key map.
 * @constructor
 * @class
 * This class provides the basic keyboard mappings for Dwt components. The
 * key bindings are taken from the class AjxKeys, which is populated from a
 * properties file. The identifiers used in the properties file must match
 * those used here.
 * 
 * @author Ross Dargahi
 */
DwtKeyMap = function(subclassInit) {
	if (subclassInit) {	return };

	this._map			= {};
	this._args			= {};
	this._checkedMap	= {};	// cache results of _checkMap()
	this._repeat		= {};	// actions that support keyboard auto-repeat

	this._load(this._map, AjxKeys);

	DwtKeyMap.MOD_ORDER[DwtKeyMap.ALT]		= 1;
	DwtKeyMap.MOD_ORDER[DwtKeyMap.CTRL]		= 2;
	DwtKeyMap.MOD_ORDER[DwtKeyMap.META]		= 3;
	DwtKeyMap.MOD_ORDER[DwtKeyMap.SHIFT]	= 4;
};

DwtKeyMap.deserialize =
function(keymap) {
	alert("DwtKeyMap.deserialize: NOT IMPLEMENTED");
};

DwtKeyMap.serialize =
function(keymap) {
	alert("DwtKeyMap.serialize: NOT IMPLEMENTED");
};

// translations for map names used in properties file
DwtKeyMap.MAP_NAME = {};
DwtKeyMap.MAP_NAME["dialog"]			= "DwtDialog";
DwtKeyMap.MAP_NAME["button"]			= "DwtButton";
DwtKeyMap.MAP_NAME["list"]				= "DwtListView";
DwtKeyMap.MAP_NAME["menu"]				= "DwtMenu";
DwtKeyMap.MAP_NAME["editor"]			= "DwtHtmlEditor";
DwtKeyMap.MAP_NAME["toolbar"]			= "DwtToolBar";
DwtKeyMap.MAP_NAME["toolbarHorizontal"]	= "DwtToolBar-horiz";
DwtKeyMap.MAP_NAME["toolbarVertical"]	= "DwtToolBar-vert";
DwtKeyMap.MAP_NAME["tabView"]			= "DwtTabView";
DwtKeyMap.MAP_NAME["tree"]				= "DwtTreeItem";

// reverse map of above
DwtKeyMap.MAP_NAME_R = {};
(function() {
    for (var i in DwtKeyMap.MAP_NAME) {
        DwtKeyMap.MAP_NAME_R[DwtKeyMap.MAP_NAME[i]] = i;
    }
})();

// Returns true if the given key is a modifier. The list of modifier keys is
// taken from the AjxKeys properties file.
DwtKeyMap.IS_MODIFIER = {};

// Order filled in by DwtKeyMapMgr._processKeyDefs()
DwtKeyMap.MOD_ORDER		= {};

// Key names
DwtKeyMap.ARROW_DOWN		= "ArrowDown";
DwtKeyMap.ARROW_LEFT		= "ArrowLeft";
DwtKeyMap.ARROW_RIGHT		= "ArrowRight";
DwtKeyMap.ARROW_UP			= "ArrowUp";
DwtKeyMap.BACKSLASH			= "Backslash";
DwtKeyMap.BACKSPACE			= "Backspace";
DwtKeyMap.COMMA				= "Comma";
DwtKeyMap.SEMICOLON			= "Semicolon";
DwtKeyMap.DELETE			= "Del";
DwtKeyMap.END				= "End";
DwtKeyMap.ENTER				= "Enter";
DwtKeyMap.ESC				= "Esc";
DwtKeyMap.HOME				= "Home";
DwtKeyMap.PAGE_DOWN			= "PgDown";
DwtKeyMap.PAGE_UP			= "PgUp";
DwtKeyMap.SPACE				= "Space";
DwtKeyMap.TAB				= "Tab";

// Action codes
DwtKeyMap.ACTION			= "ContextMenu";
DwtKeyMap.SELECT_CURRENT	= "SelectCurrent";
DwtKeyMap.ADD_SELECT_NEXT	= "AddNext";
DwtKeyMap.ADD_SELECT_PREV	= "AddPrevious";
DwtKeyMap.CANCEL			= "Cancel";
DwtKeyMap.COLLAPSE			= "Collapse";
DwtKeyMap.DBLCLICK			= "DoubleClick";
DwtKeyMap.EXPAND			= "Expand";
DwtKeyMap.GOTO_TAB			= "GoToTab";
DwtKeyMap.HEADER1			= "Header1";
DwtKeyMap.HEADER2			= "Header2";
DwtKeyMap.HEADER3			= "Header3";
DwtKeyMap.HEADER4			= "Header4";
DwtKeyMap.HEADER5			= "Header5";
DwtKeyMap.HEADER6			= "Header6";
DwtKeyMap.JUSTIFY_CENTER	= "CenterJustify";
DwtKeyMap.JUSTIFY_LEFT		= "LeftJustify";
DwtKeyMap.JUSTIFY_RIGHT		= "RightJustify";
DwtKeyMap.NEXT				= "Next";
DwtKeyMap.NEXT_TAB			= "NextTab";
DwtKeyMap.NO				= "No";
DwtKeyMap.PARENTMENU		= "ParentMenu";
DwtKeyMap.PREV				= "Previous";
DwtKeyMap.PREV_TAB			= "PreviousTab";
DwtKeyMap.SELECT_ALL		= "SelectAll";
DwtKeyMap.SELECT			= "Select";
DwtKeyMap.SELECT_FIRST		= "SelectFirst";
DwtKeyMap.SELECT_LAST		= "SelectLast";
DwtKeyMap.SELECT_NEXT		= "SelectNext";
DwtKeyMap.SELECT_PREV		= "SelectPrevious";
DwtKeyMap.SUBMENU			= "SubMenu";
DwtKeyMap.SWITCH_MODE		= "SwitchMode";
DwtKeyMap.TEXT_BOLD			= "Bold";
DwtKeyMap.TEXT_ITALIC		= "Italic";
DwtKeyMap.TEXT_UNDERLINE	= "Underline";
DwtKeyMap.TEXT_STRIKETHRU	= "Strikethru";
DwtKeyMap.YES				= "Yes";

DwtKeyMap.GOTO_TAB_RE = new RegExp(DwtKeyMap.GOTO_TAB + "(\\d+)");

DwtKeyMap.JOIN		= "+";			// Modifier join character
DwtKeyMap.SEP		= ",";			// Key separator
DwtKeyMap.INHERIT	= "INHERIT";	// Inherit keyword.

DwtKeyMap.prototype.getMap =
function() {
	return this._map;
};

/**
 * Converts a properties representation of shortcuts into a hash. The
 * properties version is actually a reverse map of what we want, so we
 * have to swap keys and values. Handles platform-specific shortcuts,
 * and inheritance. The properties version is made available via a
 * servlet.
 * 
 * @param map			[hash]		hash to populate with shortcuts
 * @param keys			[hash]		properties version of shortcuts
 * @param mapNames		[hash]*		additional map for getting internal map names
 */
DwtKeyMap.prototype._load =
function(map, keys, mapNames) {

	mapNames = mapNames || {};

	// preprocess for platform-specific bindings
	var curPlatform = AjxEnv.platform.toLowerCase();
	for (var propName in keys) {
		var parts = propName.split(".");
		var last = parts[parts.length - 1];
		if (last == "win" || last == "mac" || last == "linux") {
			if (last == curPlatform) {
				var baseKey = parts.slice(0, parts.length - 1).join(".");
				keys[baseKey] = keys[propName];
			}
			keys[propName] = null;
		}
	}
	
	for (var propName in keys) {
		var propValue = AjxStringUtil.trim(keys[propName]);
		if (!propValue || (typeof keys[propName] != "string")) { continue; }
		var parts = propName.split(".");
		var field = parts[parts.length - 1];
		var isMap = (parts.length == 2);
		var action = isMap ? null : parts[1];
		if (parts[0] == "keys") {
			this._processKeyDef(action, field, propValue);
			continue;
		}
		if (field != DwtKeyMap.INHERIT && field != "keycode") { continue; }
		var mapName = DwtKeyMap.MAP_NAME[parts[0]] || mapNames[parts[0]];
		if ((this._checkedMap[mapName] === false) ||
			(!this._checkedMap[mapName] && !this._checkMap(mapName))) { continue; }
		if (!map[mapName]) {
			map[mapName] = {};
		}
		if (!this._checkAction(mapName, action)) { continue; }
		var keySequences = propValue.split(/\s*;\s*/);
		for (var i = 0; i < keySequences.length; i++) {
			var ks = this._canonicalize(keySequences[i]);
			if (field == DwtKeyMap.INHERIT) {
				var parents = ks.split(/\s*,\s*/);
				var parents1 = [];
				for (var p = 0; p < parents.length; p++) {
					parents1[p] = DwtKeyMap.MAP_NAME[parents[p]] || mapNames[parents[p]];
				}
				map[mapName][parts[1]] = parents1.join(",");
			} else if (field == "keycode") {
				map[mapName][ks] = action;
			}
		}
		var repeatKey = [parts[0], action, "repeat"].join(".");
		var repeatValue = keys[repeatKey];
		if (repeatValue && repeatValue.toLowerCase() != "false") {
			if (!this._repeat[mapName]) {
				this._repeat[mapName] = {};
			}
			this._repeat[mapName][action] = true;
		}
	}
};

/**
 * Returns true if this map is valid. This class always returns true,
 * but subclasses may override to do more checking.
 *
 * @param mapName	[string]	name of map
 */
DwtKeyMap.prototype._checkMap =
function(mapName) {
	var result = true;
	this._checkedMap[mapName] = result;
	return result;
};

/**
 * Returns true if this action is valid. This class always returns true,
 * but subclasses may override to do more checking.
 *
 * @param mapName	[string]	name of map
 * @param action	[string]	action to check
 */
DwtKeyMap.prototype._checkAction =
function(mapName, action) {
	return true;
};

/**
 * Sets up constants for a modifier key as described in a properties file.
 * 
 * @param key	[string]		ctrl, alt, shift, or meta
 * @param field	[string]		display or keycode
 * @param value	[string|int]	property value
 */
DwtKeyMap.prototype._processKeyDef = 
function(key, field, value) {
	if (!key || !field || !value) { return; }
	if (field == "display") {
		DwtKeyMap[key.toUpperCase()] = value;
	} else if (field == "keycode") {
		DwtKeyMap.IS_MODIFIER[value] = true;
	}
};

/**
 * Ensures a predictable order for the modifiers in a key sequence:
 * 
 * 			Alt Ctrl Meta Shift
 * 
 * Example: "Shift+Ctrl+U" will be transformed into "Ctrl+Shift+U"
 * 
 * @param ks	[string]	key sequence
 */
DwtKeyMap.prototype._canonicalize =
function(ks) {
	var keys = ks.split(DwtKeyMap.SEP);
	var result = [];
	for (var i = 0; i < keys.length; i++) {
		var key = keys[i];
		var parts = key.split(DwtKeyMap.JOIN);
		if (parts.length > 2) {
			var mods = parts.slice(0, parts.length - 1);
			mods.sort(function(a, b) {
				var sortA = DwtKeyMap.MOD_ORDER[a] || 0;
				var sortB = DwtKeyMap.MOD_ORDER[b] || 0;
				return Number(sortA - sortB);
			});
			mods.push(parts[parts.length - 1]);
			result.push(mods.join(DwtKeyMap.JOIN));
		} else {
			result.push(key);
		}
	}
	return result.join(",");
};
