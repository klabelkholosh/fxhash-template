#------------------------------------------------------------------------------
# Boo Chain - Art
#------------------------------------------------------------------------------

.DEFAULT_GOAL := default

#------------------------------------------------------------------------------
# setup
#------------------------------------------------------------------------------

.PHONY: npm-setup

npm-setup:
	npm install

#------------------------------------------------------------------------------
# build
#------------------------------------------------------------------------------

.PHONY: default all dist

default: all

app/art.js: src/traits.js src/boot.js src/index.js src/art.js	# hi ben! make sure this is a list of your files in src :)
	gulp js:art

app/min/art-min.js: app/art.js
	gulp js:min

all: app/min/art-min.js
	:

#------------------------------------------------------------------------------
# misc
#------------------------------------------------------------------------------

watch:
	gulp watch
