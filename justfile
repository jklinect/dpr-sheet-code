# Prints the names of all available recipes.
help:
    just --list --unsorted

# Sets up the node environment.
install:
    npm install

# Runs npm build.
build:
    npm run build

# Runs the linters.
lint:
    npm run lint

# Runs the test suite.
test *suite:
    npm test {{suite}}

# Displays code coverage for the test suite.
coverage *suite:
    npm run coverage {{suite}}

# Pushes the project files up to the Apps Script project.
push:
    clasp push

# Pulls down the latest copy of the Apps Script project.
pull projectId:
    clasp clone {{projectId}}
