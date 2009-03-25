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

package com.zimbra.webClient.servlet;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class Forward extends ZCServlet
{
    public static final String DEFAULT_FORWARD_URL = 
	"/public/login.jsp";
    private static final String PARAM_FORWARD_URL = "fu";
    
    public void doGet (HttpServletRequest req,
		       HttpServletResponse resp) {

	try {
	    String url = getReqParameter(req, PARAM_FORWARD_URL,
                                         DEFAULT_FORWARD_URL);
	    String qs = req.getQueryString();
	    if (qs != null && !qs.equals("")){
		url = url + "?" + qs;
	    }
	    ServletContext sc = getServletConfig().getServletContext();
	    sc.getRequestDispatcher(url).forward(req, resp);
	} catch (Exception ex) {
	    resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
	    ex.printStackTrace ();
	}
    }    
}
