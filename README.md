# Calendar app

This is a simple calendar app for webxdc.
You can create and delete events to share with other people.

![image](https://user-images.githubusercontent.com/50194845/177145963-62df6494-61f6-47a1-9e75-fed0a51c935b.jpg)

[Download .xdc from Release Assets](https://github.com/webxdc/calendar/releases),
attach to a Delta Chat group and share events!

[Online Demo](https://webxdc.github.io/calendar/)


## Building

To create a `.xdc` file that can be attached to a Delta Chat group, execute:

```sh
./create-xdc.sh
```

Then just add the `.xdc` file to a group or a chat and you are ready to go!

Import, export and share are using ICS format as described in
[RFC 5545](https://datatracker.ietf.org/doc/html/rfc5545) and used in practise.
ICS compatibility been tested with Simple Calendar, Etar, Thunderbird, Google and Apple Calendar -
please let us know, if there is something to add.

To make the code base of this small project useful and accessible for many developers,
we tried not to dive into tool and framework discussions
(which are very opinionated anyways)
but vote for vanilla JavaScript, HTML and CSS, no strings attached.
The side effect is a very lightweight app, less than 20k - where the icon takes a big part :)

Of course, PRs are very welcome, nothing is set into stone!
We would love to see rough corners in the code being grinded -
and new features arising :)
