"use strict";

require("dotenv").config();

const puppeteer = require("puppeteer");
const cheerio = require("cheerio");

const url = process.env.SITE;

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
        let $ = cheerio.load(
          await page.evaluate(() => {
            return document.documentElement.innerHTML;
          })
        );
      } else {
        counter++;
        page.waitForTimeout(5000);
        page.reload();

        if (counter == process.env.MAXIMUM_RECONNECTION) {
          consoleMessage("OFFLINE");
          clearInterval(robot);
          await browser.close();
        }
      }
    }, 5000);
  } catch {
    await browser.close();
  }
})();

function consoleMessage(message) {
  console.log(message);
}
