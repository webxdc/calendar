# Calendar app [![CI](https://github.com/webxdc/calendar/actions/workflows/ci.yml/badge.svg)](https://github.com/webxdc/calendar/actions/workflows/ci.yml)

This is a simple calendar app for WebXDC.
You can create and delete events to share with other people.

<img width=250 src=https://github.com/webxdc/calendar/assets/9800740/db3693b7-0bd4-4efc-912a-d5fe075a8f79>

## Get the app

Download [calendar.xdc](https://github.com/webxdc/calendar/releases/latest/download/calendar.xdc) file
from [Release Assets](https://github.com/webxdc/calendar/releases), attach to a Delta Chat group
and share events!

[Online Demo](https://webxdc.github.io/calendar/)

## Import/Export compatibility

Import, export and share are using ICS format as described in
[RFC 5545](https://datatracker.ietf.org/doc/html/rfc5545) and used in practise.
ICS compatibility has been tested with Simple Calendar, Etar, Thunderbird, Google and Apple Calendar -
please let us know, if there is something to add.

## Contributing / Building from source

Currently the project uses vanilla JavaScript, HTML and CSS.
Of course, PRs are very welcome, nothing is set into stone!
We would love to see rough corners in the code being grinded -
and new features arising :)

### Install development dependencies

> **NOTE:** you need to have installed [nodeJS and npm][https://docs.npmjs.com/downloading-and-installing-node-js-and-npm]

```sh
npm install
```

### Running tests

```sh
npm test
```

### Testing the app in the browser

To test the app in your browser (with hot reloading!) while you do modifications:

```sh
npm run dev-mini
# Alternatively to test in a more advanced WebXDC emulator:
npm run dev
```

### Packaging

To create a `.xdc` file that can be send to a chat in Delta Chat or any other WebXDC-capable app,
execute:

```sh
npm run build
```

The resulting optimized `.xdc` file is saved in `dist-xdc/` folder, then just send the file
to a group or a chat and you are ready to go!

### Releasing

To automatically build and create a new GitHub release with the `.xdc` file:

```
git tag v1.0.1
git push origin v1.0.1
```
