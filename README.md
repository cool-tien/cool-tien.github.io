[English](./README.md) | [中文](./README_CN.md)

## Introduction
A personal website simulates some of VS Code features and preview with .json files content.

## Features
- Select different JSON files
- Moving (dragable) filename to switch position
- Close files and preview the VS Code blank page
- Open .json and load and preview the contnet
- Preview the code of thumbnail

## Usage
Fork or download and upload to your repository. Update inside the json folder content and setting the Profile: 

```javascript
const profile = new Profile({
  files: {
    "about_me": "https://cool-void-zero.github.io/json/about_me.json", 
    "portfolio": "https://cool-void-zero.github.io/json/portfolio.json", 
    "working_experience": "https://cool-void-zero.github.io/json/working_experience.json", 
    "contact": "https://cool-void-zero.github.io/json/contact.json", 
  }, 
  active_index: 0, 
  typing_mode: false, 
  design_mode: false, 
});
```

- files: property for filename, value for the url of json file content
- active_index: The default file content after loaded will showing which tab
- typing_mode: Whether to have a typing effect when previewing content
- design_mode: The "document.designMode" set will on or off

Finally, can enable the GitHub page to host the project to live: 

On your repository > **Setting** > **Pages** section > **Branch** select **"main"**