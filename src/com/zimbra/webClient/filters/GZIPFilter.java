package com.zimbra.webClient.filters;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletOutputStream;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpServletResponseWrapper;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.List;
import java.util.zip.GZIPOutputStream;
import java.util.regex.Pattern;

public class GZIPFilter implements Filter {


    private static final String P_COMPRESSABLE_MIME_TYPES = "compressableMimeTypes";
    private static final String P_NO_COMPRESSION_USER_AGENTS = "noCompressionUserAgents";

    /*
      compression="on"
      compressionMinSize="1024"
      compressableMimeType="text/html,text/plain,text/css"
      noCompressionUserAgents=".*MSIE 6.*"
     */
    private String[] mCompressableMimeTypes;
    private List<Pattern> mNoCompressionUserAgents;

    public void init(FilterConfig filterConfig) throws ServletException {
        mNoCompressionUserAgents = new ArrayList<Pattern>();

        String mimeTypes = filterConfig.getInitParameter(P_COMPRESSABLE_MIME_TYPES);
        mCompressableMimeTypes = mimeTypes != null ? mimeTypes.split(",") : new String[0];

        String badUA = filterConfig.getInitParameter(P_NO_COMPRESSION_USER_AGENTS);
        if (badUA != null) {
            for (String ua: badUA.split(",")) {
                mNoCompressionUserAgents.add(Pattern.compile(ua, Pattern.CASE_INSENSITIVE));
            }
        }
    }

    public void destroy() { }

    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain) throws IOException, ServletException {
         if (!(req instanceof HttpServletRequest)) {
             chain.doFilter(req, res);
             return;
         }

        HttpServletRequest request = (HttpServletRequest) req;
        HttpServletResponse response = (HttpServletResponse) res;

        if (isCompressable(request)) {
            System.out.println("doFilter don't skip: "+request.getRequestURI());
            GZIPResponseWrapper wrappedResponse =
                    new GZIPResponseWrapper(response);
            chain.doFilter(req, wrappedResponse);
            wrappedResponse.finishResponse();
        } else {
            System.out.println("doFilter skip: "+request.getRequestURI());
            chain.doFilter(req, res);
        }
    }

    boolean isCompressable(HttpServletRequest request) {
        String ae = request.getHeader("accept-encoding");
        if (ae == null || ae.indexOf("gzip") == -1)
            return false;

        //if ("1".equals(request.getParameter("nogzip")))
        //    return false;

        String userAgent = request.getHeader("user-agent");
        if (userAgent != null) {
            if (!mNoCompressionUserAgents.isEmpty()) {
                for (Pattern p : mNoCompressionUserAgents) {
                    if (p.matcher(userAgent).matches())
                        return false;
                }
            }
        }

        return true;
    }

    boolean isCompressable(String ct) {
        if (ct != null) {
            for (String compCT :  mCompressableMimeTypes)
                if (ct.startsWith(compCT)) return true;
        }
        return false;
    }

    public class GZIPResponseWrapper extends HttpServletResponseWrapper {

        private HttpServletResponse mResponse = null;
        private ServletOutputStream mOutput = null;
        private PrintWriter mWriter = null;
        private boolean mCompress = false;

        public GZIPResponseWrapper(HttpServletResponse httpServletResponse) {
            super(httpServletResponse);
            mResponse = httpServletResponse;
            checkCompress(mResponse.getContentType());
        }

        public void checkCompress(String ct) {
            if (!mCompress) {
                mCompress = isCompressable(ct);
                if (mCompress)
                    mResponse.setHeader("Content-Encoding", "gzip");
            }
        }

        public void setContentType(String ct) {
            checkCompress(ct);
            super.setContentType(ct);
        }

        void finishResponse() throws IOException {
            if (mWriter != null)
                mWriter.close();
            else if (mOutput != null)
                mOutput.close();
        }

        public void flushBuffer() throws IOException {
            //System.out.println("FLUSH BUFFER");
            if (mWriter != null)
                mWriter.flush();
            else if (mOutput != null)
                mOutput.flush();
        }

        public ServletOutputStream getOutputStream() throws IOException {
            if (mOutput == null) {
                if (mWriter != null)
                    throw new IllegalStateException("getWriter() has already been called!");
                mOutput = mCompress ? new GZIPResponseStream(mResponse) : mResponse.getOutputStream();
            }
            return mOutput;
        }

        public PrintWriter getWriter() throws IOException {
            if (mWriter == null)  {
                if (mOutput != null)
                    throw new IllegalStateException("getOutputStream() has already been called!");
                mWriter = mCompress ?
                        new PrintWriter(new OutputStreamWriter(new GZIPResponseStream(mResponse), mResponse.getCharacterEncoding())) :
                        mResponse.getWriter();
            }
            return mWriter;
        }
        public void setContentLength(int length) {}

        public boolean isWriting() {
            return false;
        }
    }

    public static class GZIPResponseStream extends ServletOutputStream {
        protected GZIPOutputStream mOutput = null;
        protected HttpServletResponse mResponse = null;

        public GZIPResponseStream(HttpServletResponse response) throws IOException {
            super();
            mResponse = response;
            mOutput  = new GZIPOutputStream(mResponse.getOutputStream(), 8192);
        }
        
        public void flush() throws IOException {
            //System.out.println(this+"GZIPRS: flush");
            //Thread.dumpStack();
            mOutput.flush();
        }

        public void write(int b) throws IOException {
            byte[] buff = new byte[1];
            buff[0] = (byte)(b & 0xff);
            write(buff, 0, 1);
        }

        public void write(byte b[]) throws IOException {
            write(b, 0, b.length);
        }

        public void write(byte b[], int off, int len) throws IOException {
            //System.out.println(this+"GZIPRS: write len = "+len);
            //Thread.dumpStack();
            mOutput.write(b, off, len);
        }

        public void close() throws IOException {
            //System.out.println(this+"GZIPRS: close ");
            //Thread.dumpStack();
            if (mOutput != null)
                mOutput.close();
        }
    }
}
