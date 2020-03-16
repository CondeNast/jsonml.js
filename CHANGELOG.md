# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Breaking
- Update jsdom to v16, used in the DOM interface for using JsonML to interact with the DOM.
  BREAKING CHANGE
  jsdom requires node version 10 or greater

### Fixed
- Ensure valid table structure when creating or updating elements when
  using the `toHTML()` or `patch()` methods ([#28])

### Changed
- Use constants when comparing nodeType

[#28]: https://github.com/CondeNast/jsonml.js/pull/28

### Chores
- Update to node 10 for development and testing.
  The distributed module will remain es5-compliant using babel.
- Update babel packages to latest v7 under @babel scope

## Version 1.0.2 - 2019-04-10
### Fixed
- Add top-level index.js file to avoid issues where npm@3 can install a package missing the `main` property

## Version 1.0.1 - 2018-11-09
### Fixed
- Repair build scripts to output an es5-compatible module

## Version 1.0.0 - 2018-10-09 [YANKED]
### Fixed
- Use html.isRaw method when appending child Markup instances (#3)
- Prevent mutation if fragment param when appending (#2)

<!-- NOTE: the initial comparison point must be made against the forked sha -->
[Unreleased]: https://github.com/CondeNast/jsonml.js/compare/v1.0.1...HEAD
[1.0.1]: https://github.com/CondeNast/jsonml.js/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/CondeNast/jsonml.js/compare/094ce8108632cea364d88978f7e3724497596473...v1.0.0
