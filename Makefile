VERSION ?= $(shell head -n 1 debian/changelog| cut -d' ' -f2 | sed 's/[\(\)]*//g')

timeStamp:=$(shell date +%Y%m%d%H%M%S)

.DEFAULT_GOAL := build

.PHONY: install build archive test clean

node_modules:
	@ npx yarn install

build: node_modules
	@ npx ng build --configuration=production --build-optimizer --aot --output-hashing=all --vendor-chunk

install: build

archive:
	@ tar -czvf "dosetup-$(timeStamp).tar.gz" dist

docker:
	@ docker build -t docker.io/iabsis/hcw-doctor .

podman:
	@ podman build -t docker.io/iabsis/hcw-doctor .

do-release:
	gbp dch  --ignore-branch
	sed -i 's/UNRELEASED/focal/' debian/changelog
	sed -i "s/Version:.*/Version: $(VERSION)/" redhat/hcw-athome-caregiver.spec
	git add debian/changelog redhat/hcw-athome-caregiver.spec
	echo "You can run now:\n git commit -m \"New release ${VERSION}\""

clean:
	@ echo "cleaning the dist directory"
	@ rm -rf node_modules

INFO := @bash -c '\
  printf $(YELLOW); \
  echo "=> $$1"; \
printf $(NC)' SOME_VALUE
