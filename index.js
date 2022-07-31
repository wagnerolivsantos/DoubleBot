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

  let counter = 0,
    lastRouletteCode = "";

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    await page.goto(url);

    const robot = setInterval(async () => {
      let connectionStatus = await page.evaluate(() => {
        return navigator.onLine;
      });

      if (connectionStatus) {
        let rouletteSpin, rouletteHeader, code, date, hour, color, number;

        let $ = cheerio.load(
          await page.evaluate(() => {
            return document.documentElement.innerHTML;
          })
        );

        if (
          $("#roulette").hasClass("complete") ||
          $("#roulette").hasClass("waiting")
        ) {
          rouletteSpin = $(".sm-box");

          if (rouletteSpin.length > 0) {
            if ($(rouletteSpin[0]).hasClass("black")) color = "black";
            else if ($(rouletteSpin[0]).hasClass("red")) color = "red";
            else color = "white";

            if (color == "white") number = "0";
            else number = $(rouletteSpin[0]).text();

            try {
              await page.click(
                `.${rouletteSpin[0].attribs.class.replace(" ", ".")}`
              );

              await page.waitForSelector(".modal-portal .header h2");

              rouletteHeader = await page.$eval(
                ".modal-portal .header h2",
                (element) => element.innerText
              );

              code = rouletteHeader.slice(1, 11);
              date = rouletteHeader.slice(22, 32);
              hour = rouletteHeader.slice(33, 41);

              if (!isExistsCode(code, lastRouletteCode)) {
                lastRouletteCode = code;
                consoleMessage(
                  `[ Code: ${code}, Date: ${date}, Hour: ${hour}, Color: ${color}, Number: ${number} ]`
                );
              }

              await page.goBack();
            } catch {
              page.reload();
              page.goBack();
            }
          } else {
            consoleMessage("❌  No rounds captured!!!");
            page.reload();
          }
        } else {
          counter = 0;
        }
      } else {
        counter++;
        page.waitForTimeout(5000);
        page.reload();

        if (counter == process.env.MAXIMUM_RECONNECTION) {
          consoleMessage("💀  OFFLINE");
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
  console.log(`❱ ${message}`);
}

function isExistsCode(recentRouletteCode, lastRouletteCode) {
  return recentRouletteCode == lastRouletteCode ? true : false;
}
