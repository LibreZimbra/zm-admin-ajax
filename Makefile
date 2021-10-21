# SPDX-License-Identifier: AGPL-3.0-or-later

ANT_TARGET = $(ANT_ARG_BUILDINFO) publish-local

all: build-ant

include build.mk

install:
	cp build/zm-admin-ajax-*.jar zm-admin-ajax.jar
	$(call install_jar_lib, zm-admin-ajax.jar)
	$(call mk_install_dir, include/zm-admin-ajax)
	cp -R WebRoot src $(INSTALL_DIR)/include/zm-admin-ajax

clean: clean-ant
