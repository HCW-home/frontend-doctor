VERSION ?= $(shell head -n 1 debian/changelog| cut -d' ' -f2 | sed 's/[\(\)]*//g')

timeStamp:=$(shell date +%Y%m%d%H%M%S)

.DEFAULT_GOAL := build

.PHONY: install build archive test clean

node_modules:
	@ npx yarn install

build: node_modules
#	@ npx ng build --configuration=production --build-optimizer --aot --output-hashing=all --vendor-chunk
	npx ng build --configuration=custom

install: build

archive:
	@ tar -czvf "dosetup-$(timeStamp).tar.gz" dist

docker:
	@ docker build -t docker.io/iabsis/hcw-doctor .

build-podman:
	podman build . -t docker.io/iabsis/hcw-doctor
	@ V=$$(cat .version) ; podman tag docker.io/iabsis/hcw-doctor:latest docker.io/iabsis/hcw-doctor:$$V
	@ podman tag docker.io/iabsis/hcw-doctor:latest docker.io/iabsis/hcw-doctor:5
	@ V=$$(cat .version) ; echo "Publish podman now with:\n podman push docker.io/iabsis/hcw-doctor:$$V\n podman push docker.io/iabsis/hcw-doctor:latest\n podman push docker.io/iabsis/hcw-doctor:5"

do-git-release:
	@ git add debian/changelog redhat/hcw-athome-caregiver.spec
	@ V=$$(cat .version) ; git tag $$V
	@ V=$$(cat .version) ; echo "Publish git now with:\n git commit -m \"New release $$V\"\n git push --tag"

clean:
	@ echo "cleaning the dist directory"
	@ rm -rf node_modules

update-redhat-release:
	@ V=$$(cat .version) ; sed -i "s/Version:.*/Version: $$V/" redhat/hcw-athome-caregiver.spec

create-debian-release:
	@ gbp dch  --ignore-branch
	@ sed -i 's/UNRELEASED/focal/' debian/changelog
	@ head -n 1 debian/changelog| cut -d' ' -f2 | sed 's/[\(\)]*//g' > .version
	@ V=$$(cat .version) ; echo "Release: $$V"

do-release-all: create-debian-release update-redhat-release do-git-release build-podman

INFO := @bash -c '\
  printf $(YELLOW); \
  echo "=> $$1"; \
printf $(NC)' SOME_VALUE
