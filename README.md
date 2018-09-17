# 9GAG Lite

## Overview

This project contains a Chrome/Chromium extension for personalizing [9GAG](https://9gag.com)'s website.

Download latest version from the [Chrome Web Store](https://chrome.google.com/webstore/detail/9gag-lite/namifldkgnlkiocmnhhpbppcoimcpobm).

## Features

- Choose between `light` and `dark` theme
- Hide ads
- Simplify website layout, remove clutter
- Limit posts on hot and trending page by number of points
- Choose which type of posts to see (`images`/`GIFs`/`videos`).

### Planned

- Normalize post order
- Stop autoplaying `GIFs`/`videos`
- Download `images`/`GIFs`/`videos`
- Prevent loading hot posts in trending (by point limit)
- Multiple page layout options (e.g. hide only social links, hide only sidebar, etc.)
- Censor emojis ;)

## Project structure

- `options`: Implementation of the options popup (displayed when clicking on the extension icon)
- `scripts`: Scripts for 9GAG personalization
- `styles`: Themes and layout definitions
  - `dark`: Dark theme definitions
