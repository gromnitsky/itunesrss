out := _out/web

vendor.src := $(shell adieu -pe '$$("script").map((_,e) => $$(e).attr("src")).get().filter(v => /node_modules/.test(v)).join`\n`' index.html)
vendor.dest := $(addprefix $(out)/, $(vendor.src))

static.src := $(wildcard *.html *.js)
static.dest := $(addprefix $(out)/, $(static.src))

$(out)/%: %; $(copy)

all: $(vendor.dest) $(static.dest)

upload: all
	rsync -avPL --delete -e ssh $(out)/ gromnitsky@web.sourceforge.net:/home/user-web/gromnitsky/htdocs/js/itunesrss/

define copy
@mkdir -p $(dir $@)
cp $< $@
endef
