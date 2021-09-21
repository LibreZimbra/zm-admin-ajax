// SPDX-License-Identifier: GPL-2.0-only

package com.zimbra.webClient.filters;

import java.io.IOException;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.zimbra.common.util.StringUtil;
import com.zimbra.common.util.ZimbraLog;

public class YuiSwfFilter implements Filter {

    @Override
    public void destroy() {
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
    throws IOException, ServletException {
        if (request instanceof HttpServletRequest) {
            HttpServletRequest httpReq = (HttpServletRequest) request;
            String requestURI = httpReq.getRequestURI();
            if (requestURI.endsWith(".swf")) {
                String queryString = httpReq.getQueryString();
                if (!StringUtil.isNullOrEmpty(queryString)) {
                    ZimbraLog.misc.info("Rejecting request for access to .swf file %s with query string '%s'",
                            requestURI, queryString);
                    ((HttpServletResponse)response).sendError(HttpServletResponse.SC_FORBIDDEN);
                    return;
                }
            }
        }
        chain.doFilter(request, response);
    }

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
    }
}
