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
 * @class DwtIdleTimer
 *
 * Simple manager for "idle" events.  Add a handler like this:
 *
 *    var idleTimer = new DwtIdleTimer(10000, new AjxCallback(obj, obj.handler));
 *
 *    obj.handler = function(idle) {
 *       if (idle) {
 *          // do idle stuff here
 *       } else {
 *          // user is back
 *       }
 *    }
 *
 * With this code, when the user is idle for 10 seconds obj.handler(true) will
 * be called.  When the user gets back from idle, obj.handler(false) will be
 * called and the timer restarted.
 *
 * To cancel a timer, say idleTimer.kill().  To restart it later, you can
 * idleTimer.resurrect(timeout).  timeout is optional here, pass it only if you
 * want to modify it.
 *
 * You can create multiple handlers, each with its own callback and timeout.  A
 * new DwtIdleTimer will start running right away and will continue to do so
 * until you kill() it.
 *
 * @author Mihai Bazon <mihai@zimbra.com>
 */

DwtIdleTimer = function(timeout, handler) {
        DwtIdleTimer._initEvents();
        this.timeout = timeout;
        this.handler = handler;
        this.idle = false;
        this._onIdle = AjxCallback.simpleClosure(this.setIdle, this);
        this._startTimer();
        DwtIdleTimer.getHandlers().add(this);
};

DwtIdleTimer.prototype._startTimer = function() {
        this._stopTimer();
        this._timer = setTimeout(this._onIdle, this.timeout);
};

DwtIdleTimer.prototype._stopTimer = function() {
        if (this._timer) {
                clearTimeout(this._timer);
                this._timer = null;
        }
};

DwtIdleTimer.prototype.kill = function() {
        this._stopTimer();
        this.idle = false;
        DwtIdleTimer.getHandlers().remove(this);
};

DwtIdleTimer.prototype.resurrect = function(timeout) {
        this.idle = false; // make sure we start "unidle"
        DwtIdleTimer.getHandlers().add(this, null, true);
        if (timeout != null)
                this.timeout = timeout;
        this._startTimer();
};

DwtIdleTimer.prototype.setIdle = function() {
        if (!this.idle) {
                DwtIdleTimer.idleHandlers++;
                this.idle = true;
                this.handler.run(true);
        }
};

DwtIdleTimer.prototype.resume = function() {
        if (this.idle) {
                this.idle = false;
                this.handler.run(false);
                DwtIdleTimer.idleHandlers--;
        }
};

/* class members */

DwtIdleTimer.idleHandlers = 0;

DwtIdleTimer._initEvents = function() {
        // execute only once per session
        if (!DwtIdleTimer._initialized) {
                Dwt.setHandler(window, "onkeydown", DwtIdleTimer.resetIdle);
                Dwt.setHandler(window, "onmousemove", DwtIdleTimer.resetIdle);
                Dwt.setHandler(window, "onmousedown", DwtIdleTimer.resetIdle);
                Dwt.setHandler(window, "onfocus", DwtIdleTimer.resetIdle);
                DwtIdleTimer._initialized = true;
        }
};

DwtIdleTimer.getHandlers = function() {
        var a = DwtIdleTimer.HANDLERS;
        if (!a)
                a = DwtIdleTimer.HANDLERS = new AjxVector();
        return a;
};

DwtIdleTimer.resetIdle = function() {
        var a = DwtIdleTimer.getHandlers();
        a.foreach("_startTimer"); // we need to restart timers anyway...
        if (DwtIdleTimer.idleHandlers > 0)
                a.foreach("resume");
};
