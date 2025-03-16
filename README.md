# 5e DPR Workbook - Code

## Workbook URL

The workbook is available [here](https://docs.google.com/spreadsheets/d/1WTOgF6mWZq-tbtlJpcK_7l2IWFkEZc63zD8_45c_rDk/edit?pli=1#gid=1329118592) currently.

## Setting up

Set up [`just`](https://github.com/casey/just) and [clasp](https://github.com/google/clasp):
```shellsession
$ npm install -g rust-just @google/clasp@2.4.2
$ clasp login
```

Set up the node environment:
```shellsession
$ just install
```

Set up the `clasp` configuration in your repo:
```shellsession
$ just pull projectID
```

Edit `rootDir` in `.clasp.json` to be your repo directory.

## Running tests

```shellsession
$ just test      # runs unit tests
$ just coverage  # displays code coverage results
```

## Pushing changes up

```shellsession
$ just push
```

## Resources

Things that were handy setting this up:

* https://developers.google.com/apps-script/guides/clasp
* https://developers.google.com/apps-script/guides/typescript
* https://developers.googleblog.com/2015/12/advanced-development-process-with-apps.html
* https://github.com/google/clasp/blob/master/docs/typescript.md
* https://rpgbot.net/dnd5/tools/dpr-calculator/
* https://stackoverflow.com/questions/48791868/use-typescript-with-google-apps-s
