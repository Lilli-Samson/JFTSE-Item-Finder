TSC = tsc
TSC_FLAGS = --pretty -p
BROWSERIFY = NODE_PATH=. node_modules/.bin/browserify -p esmify
MINIFY = node_modules/uglify-js/bin/uglifyjs
RM = rm -f
CP = cp

.PHONY: all
all: release

.PHONY: release
release: browserified.js
	$(MINIFY) $< -cm > script.js

.PHONY: debug
debug: main.js
	$(BROWSERIFY) -d $< > script.js

browserified.js: main.js
	$(BROWSERIFY) $< > $@

$(patsubst %.ts,%.js,$(wildcard *.ts)) &: *.ts tsconfig.json makefile
	$(TSC) $(TSC_FLAGS) .

.PHONY: clean
clean:
	$(RM) *.js *.map
