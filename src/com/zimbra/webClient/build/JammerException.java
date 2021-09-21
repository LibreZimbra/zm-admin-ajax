// SPDX-License-Identifier: GPL-2.0-only

package com.zimbra.webClient.build;

public class JammerException extends Exception {

    public JammerException (String msg) {
        super(msg);
    }

    public JammerException (Throwable t){
        super(t);
    }
}
