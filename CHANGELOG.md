# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- (dom): Maintain empty spaces in text nodes when converting from HTML.
   Reverts an upstream change ([24f5ce7]) that modified McKamey's original logic.
   Fixes methods `fromHTML` and `fromHTMLText`.

[24f5ce7]: https://github.com/benjycui/jsonml.js/commit/24f5ce7a0da83f445865a1188744c238111ac5ac

## Version 2.1.0 - 2020-03-25
### Changed
- (utils): Allow raw Markup instances to self-identify with isMarkup prop (#33)
  The utils module no longer requires the html module and, as a result, no longer
  requires jsdom.

## Version 2.0.0 - 2020-03-17
### Breaking
- Update jsdom to v16, used in the DOM interface for using JsonML to interact with the DOM. ([#20])
  BREAKING CHANGE
  jsdom requires node version 10 or greater

### Fixed
- (html): Create document environment with jsdom if needed ([#31])
- (html): Ensure valid table structure when creating or updating elements when
  using the `toHTML()` or `patch()` methods ([#28])

### Changed
- Use constants when comparing nodeType

### Chores
- Update to node 10 for development and testing.
- Update babel packages to latest v7 under @babel scope

[#31]: https://github.com/CondeNast/jsonml.js/pull/31
[#28]: https://github.com/CondeNast/jsonml.js/pull/28
[#20]: https://github.com/CondeNast/jsonml.js/pull/20

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
