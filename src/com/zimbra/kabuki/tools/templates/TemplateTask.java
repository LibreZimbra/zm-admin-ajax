// SPDX-License-Identifier: GPL-2.0-only

package com.zimbra.kabuki.tools.templates;

import java.io.*;
import java.util.*;
import org.apache.tools.ant.*;
import org.apache.tools.ant.types.*;

import com.zimbra.common.util.TemplateCompiler;


public class TemplateTask
extends Task {

    //
    // Data
    //

    private File destDir;
    private String prefix = "";
    private boolean define = false;
    private List<FileSet> fileSets = new LinkedList<FileSet>();
	private boolean authoritative = false;
	private String format = "js";


    //
    // Public methods
    //

    public void setDestDir(File dir) {
        this.destDir = dir;
    }

    public void setPrefix(String prefix) {
        if (prefix.length() > 0 && !prefix.matches("\\.$")) {
            prefix = prefix + ".";
        }
        this.prefix = prefix;
    }

    public void setDefine(boolean define) {
        this.define = define;
    }

    public void setAuthoritative(boolean authoritative) {
        this.authoritative = authoritative;
    }

    public void addFileSet(FileSet fileSet) {
        this.fileSets.add(fileSet);
    }

	public void setFormat(String format) {
		this.format = format;
	}

    //
    // Task methods
    //

    public void execute() throws BuildException {
        if (this.destDir != null) {
            System.out.println("Destination: "+this.destDir);
        }        
        Project project = this.getProject();
        for (FileSet fileSet : this.fileSets) {
            File idir = fileSet.getDir(project);
            File odir = this.destDir != null ? this.destDir : idir;
            DirectoryScanner scanner = fileSet.getDirectoryScanner(project);
            String[] filenames = scanner.getIncludedFiles();
	        try {
		        TemplateCompiler.compile(idir, odir, prefix, filenames, format,
				                      authoritative, define);
	        } catch (IOException e) {
		        System.err.println("error: "+e.getMessage());
	        }
        }
    }

} // class TemplateTask
