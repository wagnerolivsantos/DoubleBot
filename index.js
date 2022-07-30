"use strict";

require("dotenv").config();

const puppeteer = require("puppeteer");

const url = process.env.SITE;

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: false,
      args: ["--start-maximized"],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    await page.goto(url);

    await browser.close();
  } catch {
    await browser.close();
  }
})();
