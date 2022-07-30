"use strict";

require("dotenv").config();

const puppeteer = require("puppeteer");

const url = process.env.SITE;

function consoleMessage(message) {
  console.log(message);
}

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--start-maximized"],
  });

  let counter = 0;

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    await page.goto(url);

    const robot = setInterval(async () => {
      let connectionStatus = await page.evaluate(() => {
        return navigator.onLine;
      });

      if (connectionStatus) {
        consoleMessage("Online");
      } else {
        counter++;

        page.reload();

        if (counter == process.env.MAXIMUM_RECONNECTION) {
          consoleMessage("Error: Offline");
          clearInterval(robot);
          await browser.close();
        }
      }
    }, 5000);
  } catch {
    await browser.close();
  }
})();
