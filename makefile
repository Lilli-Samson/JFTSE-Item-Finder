TSC = tsc
TSC_FLAGS = --pretty -p
BROWSERIFY = NODE_PATH=. node_modules/.bin/browserify -p esmify
MINIFY = node_modules/uglify-js/bin/uglifyjs
RM = rm -f
CP = cp

.PHONY: all
all: release

.PHONY: release
release: main.js
	$(BROWSERIFY) $< > browserified.js
	$(MINIFY) browserified.js -cm > main.js

.PHONY: debug
debug: main.js
	$(BROWSERIFY) $< > main.js

$(patsubst %.ts,%.js,$(wildcard *.ts)) &: *.ts tsconfig.json makefile
	$(TSC) $(TSC_FLAGS) .

.PHONY: clean
clean:
	$(RM) *.js *.map $(ANTLR_FILES)
