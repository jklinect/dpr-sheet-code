.phony: pull push versions

pull:
	@clasp pull

push:
	@test -f ./Code.js && rm Code.js
	@clasp push

versions:
	@clasp versions
