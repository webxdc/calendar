# Calendar [![CI](https://github.com/webxdc/calendar/actions/workflows/ci.yml/badge.svg)](https://github.com/webxdc/calendar/actions/workflows/ci.yml) [![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

> A simple WebXDC calendar application.

## Getting Started

- Download [`calendar.xdc`](https://github.com/webxdc/calendar/releases/latest/download/calendar.xdc) file
  from [release assets](https://github.com/webxdc/calendar/releases)
- Attach it to a group chat
- Added, modified or deleted events will be shared with others in the same group
- Or try out an [online demo](https://webxdc.github.io/calendar/)

<img width=250 src=https://github.com/webxdc/calendar/assets/9800740/ec264289-c8ad-4eb3-9637-cfdac8f6d2cd>

## Import / Export

The calendar is based on the ICS format as described in [`RFC 5545`](https://datatracker.ietf.org/doc/html/rfc5545) and has been tested with `Simple Calendar`, `Etar`, `Thunderbird`, `Google Calendar` and `Apple Calendar`. Please let us know if there are some features missing.

Complete calendar data can be imported from or exported to an `.ics` file and shared with other group chats. There's also an option to `Share` individual events in the same fashion.

## Contributing

The code is currently based on vanilla JavaScript, HTML and CSS. A development environment with `node.js` and `npm` installed is assumed.

### Install

```
npm install
```

### Tests

The tests are run using [`vitest`](https://github.com/vitest-dev/vitest#readme).

```
npm test
```

### Run in the browser

This is the simplest way of running the app in the browser. Hot reloading is supported.

```
npm run dev-mini
```

### Run in the WebXDC emulator

A more advanced way of running the the app using the [`webdxc-dev`](https://github.com/webxdc/webxdc-dev#readme) development server.

```
npm run dev
```

### Linting

We use [`Prettier`](https://github.com/prettier/prettier) as a linter. After you modify the code, run:

```
npm run format
```

### Building

To create a `.xdc` file that can be send to a chat in Delta Chat or any other WebXDC-capable app, execute:

```
npm run build
```

The resulting optimized `.xdc` file is saved in `dist-xdc/` folder, then just send the file to a group or a chat and you are ready to go!

### Releasing

To automatically build and create a new GitHub release with the `.xdc` file:

```
git tag v1.0.1
git push origin v1.0.1
```

## License

MPL - Mozilla Public License Version 2.0.
